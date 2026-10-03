import Foundation
import AVFoundation
import AppKit
let asset=AVURLAsset(url:URL(fileURLWithPath:CommandLine.arguments[1]))
let output=CommandLine.arguments[2]
let track=asset.tracks(withMediaType:.video)[0]
let fps=Double(track.nominalFrameRate), duration=CMTimeGetSeconds(asset.duration)
print("fps \(fps), duration \(duration)")
let gen=AVAssetImageGenerator(asset:asset);gen.appliesPreferredTrackTransform=true;gen.requestedTimeToleranceBefore = .zero;gen.requestedTimeToleranceAfter = .zero
var previous=[UInt8](repeating:0,count:64*64*4),rows=[[String:Any]]()
for frame in 0..<Int(duration*fps) {
 let time=Double(frame)/fps
 var actual=CMTime.zero
 guard let image=try? gen.copyCGImage(at:CMTime(seconds:time,preferredTimescale:60000),actualTime:&actual) else {continue}
 let bitmap=NSBitmapImageRep(cgImage:image)
 let name=String(format:"%04d.jpg",frame)
 try bitmap.representation(using:.jpeg,properties:[.compressionFactor:0.9])!.write(to:URL(fileURLWithPath:output+"/"+name))
 var pixels=[UInt8](repeating:0,count:64*64*4)
 pixels.withUnsafeMutableBytes{b in let c=CGContext(data:b.baseAddress,width:64,height:64,bitsPerComponent:8,bytesPerRow:256,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!;c.draw(image,in:CGRect(x:0,y:0,width:64,height:64))}
 var score=0.0
 for j in stride(from:0,to:pixels.count,by:4){for k in 0..<3{score+=Double(abs(Int(pixels[j+k])-Int(previous[j+k])))}}
 score /= 4096*3*255
 rows.append(["frame":frame,"requested":time,"actual":CMTimeGetSeconds(actual),"difference":score,"file":name]);previous=pixels
}
let data=try JSONSerialization.data(withJSONObject:["fps":fps,"duration":duration,"frames":rows],options:[.prettyPrinted,.sortedKeys])
try data.write(to:URL(fileURLWithPath:output+"/timing.json"))
