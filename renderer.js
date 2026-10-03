// Rendering coordinates use the source film's 720 × 720 image plane.
export class FilmRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = this.gl = canvas.getContext('webgl', {alpha:false, antialias:true, preserveDrawingBuffer:true});
    if (!gl) throw new Error('WebGL을 사용할 수 없습니다. 하드웨어 가속을 확인해주세요.');
    this.textures = new Map();
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    this.paper = this.program(`attribute vec2 a; varying vec2 uv;
      void main(){uv=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}`,
      `precision highp float;varying vec2 uv;uniform sampler2D image;uniform float zoom;uniform vec2 pan;
      void main(){vec2 p=(uv-.5)/zoom+.5+pan;gl_FragColor=texture2D(image,clamp(p,vec2(.001),vec2(.999)));}`,
      ['image','zoom','pan']);
    this.specimen = this.program(`
      attribute vec2 a;varying vec2 uv;varying float light;
      uniform vec2 center;uniform vec2 dimensions;uniform float sourceAngle;uniform vec2 span;
      uniform vec3 position;uniform float scale;uniform float fold;uniform float roll;uniform float pitch;
      void main(){
        vec2 v=vec2(mix(span.x,span.y,a.x*.5+.5),a.y);
        vec2 sourcePoint=v*dimensions*.5;
        float c=cos(sourceAngle),s=sin(sourceAngle);
        uv=(center+mat2(c,s,-s,c)*sourcePoint)/720.;
        vec3 p=vec3(sourcePoint*scale,0.);
        p=vec3(p.x*cos(fold),p.y,-p.x*sin(fold));
        p=vec3(p.x,p.y*cos(pitch)-p.z*sin(pitch),p.y*sin(pitch)+p.z*cos(pitch));
        c=cos(roll);s=sin(roll);p.xy=mat2(c,s,-s,c)*p.xy;
        p+=position;
        float w=max(75.,850.-p.z);
        gl_Position=vec4((p.x-360.)/360.*850.,(360.-p.y)/360.*850.,0.,w);
        light=.94+.06*abs(cos(fold));
      }`, `
      precision highp float;varying vec2 uv;varying float light;
      uniform sampler2D image;uniform vec3 paperColor;uniform float blur;uniform float alpha;
      vec4 matte(vec2 p){vec4 texel=texture2D(image,p);vec3 rgb=texel.rgb;
        float d=length(rgb-paperColor);float a=smoothstep(.07,.18,d)*texel.a;
        vec3 color=clamp((rgb-paperColor*(1.-a))/max(a,.02),0.,1.);
        return vec4(color*a,a);}
      void main(){vec2 b=vec2(blur/720.,0.);vec4 c=matte(uv)*.4;
        c+=(matte(uv+b)+matte(uv-b)+matte(uv+b.yx)+matte(uv-b.yx))*.15;
        if(c.a<.008)discard;gl_FragColor=vec4(c.rgb*light*alpha,c.a*alpha);}`,
      ['image','center','dimensions','sourceAngle','span','position','scale','fold','roll','pitch','paperColor','blur','alpha']);
    this.videoTexture = this.texture();
  }
  program(vertex,fragment,names){
    const gl=this.gl,p=gl.createProgram();
    for(const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const shader=gl.createShader(type);gl.shaderSource(shader,code);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(p,shader);
    }
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
    return {p,a:gl.getAttribLocation(p,'a'),u:Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]))};
  }
  texture(image){
    const gl=this.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(image)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    return tex;
  }
  use(program){const gl=this.gl;gl.useProgram(program.p);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.enableVertexAttribArray(program.a);gl.vertexAttribPointer(program.a,2,gl.FLOAT,false,0,0);}
  resize(){const n=Math.max(1,Math.min(1440,Math.round(this.canvas.clientWidth*Math.min(devicePixelRatio,2))));if(this.canvas.width!==n)this.canvas.width=this.canvas.height=n;this.gl.viewport(0,0,n,n);}
  plate(image,{zoom=1,pan=[0,0],dynamic=false}={}){
    const gl=this.gl;this.resize();gl.disable(gl.BLEND);this.use(this.paper);
    let texture;
    if(dynamic){texture=this.videoTexture;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);}
    else{texture=this.textures.get(image);if(!texture){texture=this.texture(image);this.textures.set(image,texture);}}
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(this.paper.u.image,0);gl.uniform1f(this.paper.u.zoom,zoom);gl.uniform2fv(this.paper.u.pan,pan);gl.drawArrays(gl.TRIANGLES,0,6);
    // Limit resident plate textures; decoded images remain reusable without re-downloading.
    if(this.textures.size>8){const [oldKey,oldTexture]=this.textures.entries().next().value;if(oldKey!==image){gl.deleteTexture(oldTexture);this.textures.delete(oldKey);}}
  }
  butterfly(image,spec,motion){
    const gl=this.gl,{u}=this.specimen;this.use(this.specimen);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    if(!this.butterflyTextures)this.butterflyTextures=new Map();
    if(!this.butterflyTextures.has(image))this.butterflyTextures.set(image,this.texture(image));
    gl.bindTexture(gl.TEXTURE_2D,this.butterflyTextures.get(image));gl.uniform1i(u.image,0);
    gl.uniform2fv(u.center,spec.center);gl.uniform2fv(u.dimensions,spec.dimensions);gl.uniform1f(u.sourceAngle,spec.angle||0);
    const perspective=850/(850-motion.z);
    gl.uniform3f(u.position,360+(motion.x-360)/perspective,360+(motion.y-360)/perspective,motion.z);
    gl.uniform1f(u.scale,motion.scale);gl.uniform1f(u.roll,motion.roll);gl.uniform1f(u.pitch,motion.pitch||0);
    gl.uniform3fv(u.paperColor,[.91,.858,.764]);gl.uniform1f(u.blur,motion.blur||0);gl.uniform1f(u.alpha,motion.alpha??1);
    for(const side of [-1,1,0]){
      const body=side===0;
      gl.uniform2f(u.span,body?-.045:side===-1?-1:.045,body?.045:side===-1?-.045:1);
      gl.uniform1f(u.fold,body?0:-side*motion.flap*(side===1?.94:1));gl.drawArrays(gl.TRIANGLES,0,6);
    }
  }
}
