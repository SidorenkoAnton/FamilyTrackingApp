import { registerWebModule, NativeModule } from 'expo';

class LocationTrackingModule extends NativeModule<{}> {}

export default registerWebModule(LocationTrackingModule, 'LocationTrackingModule');
