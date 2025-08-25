import Foundation
import CoreLocation

@objc(TrackingModule)
class TrackingModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func saveAuth(_ token: String, socketUrl: String, event: String?) {
    TrackingManager.shared.saveAuth(token: token, socketUrl: socketUrl, event: event)
  }

  @objc func start(_ options: NSDictionary?) {
    let ns = options?["namespace"] as? String   // 👈
    TrackingManager.shared.setNamespace(ns)     // 👈

    let dist = options?["minDistanceMeters"] as? Double
    let throttle = options?["throttleMs"] as? Int
    let actStr = options?["activityType"] as? String
    var act: CLActivityType = .fitness
    if actStr == "automotive" { act = .automotiveNavigation }
    if let t = throttle { TrackingManager.shared.throttleMs = t }
    TrackingManager.shared.start(intervalMeters: dist, accuracy: kCLLocationAccuracyBest, activity: act)
  }

  @objc func update(_ options: NSDictionary) {
    if let ns = options["namespace"] as? String {
      TrackingManager.shared.setNamespace(ns)   // 👈 (si quieres permitir cambiar runtime)
    }
    let dist = options["minDistanceMeters"] as? Double
    let throttle = options["throttleMs"] as? Int
    TrackingManager.shared.update(distanceMeters: dist, throttleMs: throttle)
  }
  
  @objc func stop() { TrackingManager.shared.stop() }
}
