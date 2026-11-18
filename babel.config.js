module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4: KHÔNG thêm "react-native-reanimated/plugin" ở đây.
    // babel-preset-expo (SDK 54+) và nativewind/babel đã tự nạp react-native-worklets/plugin;
    // khai báo thêm sẽ biến đổi worklet nhiều lần → lỗi "undefined is not a function".
  };
};