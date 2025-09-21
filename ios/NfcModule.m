//
//  NfcModule.m
//  trablisaRN
//
//  Created by Administrador on 25/08/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NfcModule, NSObject)

RCT_EXTERN_METHOD(isSupported:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scanTag:(NSDictionary * _Nullable)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return YES; }

@end
