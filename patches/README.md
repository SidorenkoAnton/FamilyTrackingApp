# patches/

## `expo-location+57.0.19.patch`

Патч закрывает баг expo-location на Android: в `LocationTaskConsumer` опции фоновой
задачи читаются из `Map<String, Any?>` конструктором
`LocationOptions(map)` в `LocationArguments.kt`, где используются safe-cast-ы
`as? Int` / `as? Long`. Числа из JS приходят в натив как `Double`
(см. `expo-modules-core/.../JSTypeConverterHelper.kt` → `is Number -> putDouble(...)`),
поэтому `Double as? Int` и `Double as? Long` возвращают `null`, и `accuracy`,
`distanceInterval`, `timeInterval` молча отбрасываются.

В результате `Location.startLocationUpdatesAsync` всегда использует дефолты пресета
`Accuracy.Balanced`: интервал 3 секунды и фильтр «сдвиг не менее 100 метров».
Из-за этого координаты не отправляются, пока телефон стоит на месте, а на эмуляторе
повторный `Set Location` в ту же точку не даёт ни одного фикса.

Патч приводит типы через `Number`, ровно как это уже сделано в самом expo-location
для `deferredUpdatesInterval` (`LocationTaskConsumer.kt`).

Актуально и в 57.0.20 (в CHANGELOG фикса нет). Репорт: https://github.com/expo/expo/issues/46788

### Важно

Это нативная правка: после неё нужна **пересборка приложения**
(`eas build -p android --profile preview` или `npx expo run:android`).
OTA-обновление (expo-updates) её не доставит.

Патч применяется автоматически на `npm install` через скрипт `postinstall`.

### Проверка

```sh
npx patch-package          # должно быть: expo-location@57.0.19 ✔
```

Если нужно перегенерировать патч: правим файл в `node_modules/expo-location`,
затем `npx patch-package expo-location`.
