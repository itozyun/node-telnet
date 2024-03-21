[node-telnet](https://github.com/TooTallNate/node-telnet) は [node-telnet2](https://github.com/chjj/node-telnet2) をマージ済なのでこちらを使う。

サンプルは node-telnet2 の [README](https://github.com/chjj/node-telnet2#readme) のものを使う。但し blessed ではなく、neo-blessed を使う。

# sample1

node をコマンドラインから使う

~~~
node repl.js
~~~

# blessed.js

~~~
node blessed.js
~~~


[Node.js で Shift-JIS ファイル を 読み書き する 方法](https://garafu.blogspot.com/2017/07/nodejs-read-write-sjis-file.html)


# windows-ansi ターミナルタイプについて

1. terminal_type は ansi, vt100, vt52, vtnt
2. utf8 が不可。
3. 枠線の後のカーソル一文字移動がズレる

# lang -> charcode

lang 設定と term で charcode が utf8 から Shift_JIS 等に切り替わる

# blessed(neo-blessed) のフォーク

## 動作モード

1. terminal
2. html + CSS
3. html
4. textarea

## Widgets

* WebView

## terminfo の組み込み

terminfo.src から terminfo.json を作る

[sample](https://github.com/qix-/terminfo)

[terminfo - 端末ケーパビリティのデータベース ](https://nxmnpg.lemoda.net/ja/5/terminfo)

.submodules\neo-blessed\usr\window-ansi.json が tput オブジェクトを書きだしたもの。