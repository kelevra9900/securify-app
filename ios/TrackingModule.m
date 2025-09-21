//
//  TrackingModule.m
//  trablisaRN
//
//  Created by Administrador on 23/08/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TrackingModule, NSObject)
RCT_EXTERN_METHOD(saveAuth:(NSString *)token
                  socketUrl:(NSString *)socketUrl
                  event:(NSString * _Nullable)event)

RCT_EXTERN_METHOD(start:(NSDictionary * _Nullable)options)

RCT_EXTERN_METHOD(update:(NSDictionary * _Nonnull)options)

RCT_EXTERN_METHOD(stop)

RCT_EXTERN_METHOD(requestPermissions)
@end
