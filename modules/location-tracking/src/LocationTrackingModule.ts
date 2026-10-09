import { NativeModule, requireNativeModule } from 'expo';

declare class LocationTrackingModule extends NativeModule<{}> {}

export default requireNativeModule<LocationTrackingModule>('LocationTracking');
