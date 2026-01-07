# ズイズイリズムゲーム デプロイ手順

## GitHub Desktopでのデプロイ方法

### 1. GitHubリポジトリの準備

1. GitHub Desktopを開く
2. `File` → `Add Local Repository` を選択
3. このプロジェクトフォルダを選択
4. `Publish repository` をクリックしてGitHubにアップロード

### 2. Netlifyでのデプロイ

#### Netlifyアカウントの作成
1. [Netlify](https://www.netlify.com/)にアクセス
2. GitHubアカウントでサインアップ

#### デプロイ設定
1. Netlifyダッシュボードで `Add new site` → `Import an existing project` を選択
2. GitHubを選択し、アップロードしたリポジトリを選択
3. ビルド設定を以下のように設定:
   - **Build command**: `npx expo export --platform web`
   - **Publish directory**: `dist`
   - **Base directory**: (空欄)

4. `Deploy site` をクリック

#### 環境変数の設定（必要な場合）
1. Netlifyダッシュボードで `Site settings` → `Environment variables` を選択
2. 必要な環境変数を追加

### 3. カスタムドメインの設定（オプション）

1. Netlifyダッシュボードで `Domain settings` を選択
2. `Add custom domain` をクリック
3. 所有しているドメインを入力
4. DNSレコードを設定

## 手動デプロイ方法

### ローカルでビルド

```bash
# 依存関係をインストール
pnpm install

# ビルド
npx expo export --platform web
```

### distフォルダをアップロード

1. `dist` フォルダの内容を確認
2. Netlify Drop（https://app.netlify.com/drop）にアクセス
3. `dist` フォルダをドラッグ&ドロップ

## トラブルシューティング

### ビルドエラーが発生する場合

1. キャッシュをクリア:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .expo
   ```

2. 依存関係を再インストール:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. ビルドを再実行:
   ```bash
   npx expo export --platform web --clear
   ```

### 動画が再生されない場合

- ブラウザの自動再生ポリシーにより、動画が再生されない場合があります
- ユーザーの操作（タップ）後に動画を再生するように設定されています

## 注意事項

- 動画ファイルが大きいため、初回読み込みに時間がかかる場合があります
- モバイルデバイスでは、データ通信量に注意してください
- 本番環境では、CDNを使用して動画を配信することを推奨します
