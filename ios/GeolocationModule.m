//
//  GeolocationModule.m
//  trablisaRN
//
//  Created by Administrador on 25/08/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GeolocationModule, NSObject)

RCT_EXTERN_METHOD(requestPermissions)

RCT_EXTERN_METHOD(getCurrentPosition:(NSDictionary * _Nullable)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
