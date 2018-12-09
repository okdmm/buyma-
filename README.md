# buyma自動出品ツール

## 動作環境

## 使い方 

### Step 0: git clone 

cloneしてください
```
$ git clone git@github.com:okdmm/buyma-.git
```

### Step 1: パッケージのインストール

パッケージのインストール
```
$ npm install
```

### Step 2: csvファイルと画像の用意

csvファイルは list.csvという名前で保存して./に置いてください。
画像は指定した名前のフォルダを作り、./img/に置いてください。

### Step 3: パスワードとユーザーIDの入力

.envファイルの作成
``` ./
$ touch .env
```

パスワードとユーザーIDを入力して保存
``` ./.env
MY_USER_ID =  **********
MY_PASSWORD = **********
```

### Step 4: 実行

注意点として実行中はキーボードの操作は控えた方が良いです。
```
$ npm start
```

## 準備中
- 実行後のファイル移動(csvと画像ファイルを実行場所外へ移動);
- タイムアウトエラー処理
- エラー個所の詳細表示
- タグ: 対応
- サイズ:cmに対応

## License
- MIT
