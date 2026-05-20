# host-tts（開発のみ / T-DOC-004）

macOS 専用。Asterisk IVR 用の日本語ガイダンス WAV をローカル生成します。

## 前提

- macOS（`say` / `afconvert`）
- denwa リポのルートで実行

## 使い方

```bash
chmod +x host-tts/make-prompts.sh
./host-tts/make-prompts.sh
```

生成先: `asterisk/sounds/custom/*.wav`（8 kHz mono PCM）

音声: 環境変数 `TTS_VOICE`（既定 `Kyoko`）

## 本番

- CI / harness の対象外（manual-only）
- 生成した wav は `/guidances` アップロードまたは git にコミットするかは運用次第
- legacy OpenPBX と同じ文言セット（`../OpenPBX/host-tts/` と同期推奨）
