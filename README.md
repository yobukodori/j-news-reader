# 日本語ニュースリーダー

日本語ニュースを掲載しているサイトやRSSから記事を収集してリンク付きでタイトルを表示します。  
日付が新しい順に表示、また記事URLが重複する場合は初出のみ表示  

<img src="https://user-images.githubusercontent.com/32874862/203213045-2724d68d-149b-4d78-8274-f9a5af76839f.jpg" style="width:90%">

## 【動作条件】

 - ブラウザにクロスドメインのリクエストを可能にするCORS操作拡張機能を入れてください。  
＊私はFirefoxに自作 [CORS&#32;for&#32;Me](https://addons.mozilla.org/ja/firefox/addon/cors-for-me/) を入れて使用しています
- ニュースリーダー (index.html) をロードした時ページ下部に表示されるURLに対するクロスドメインリクエストを許可してください。

<img src="https://user-images.githubusercontent.com/32874862/203213276-b4cf045f-74fb-488b-8694-1b92b094120f.jpg" style="width:90%">

   
   【CORS for Meでの設定例】  
![cors4me setting](https://user-images.githubusercontent.com/32874862/206502451-6648d126-3569-4f60-8670-8a5aad9033cb.jpg)




## 使い方

ページ (index.html) をロードすると自動的にニュースの収集を始めて結果を表示します。 
すべてのファイルをローカルに置いて使用することもできますし、こちら (https://yobukodori.github.io/j-news-reader/index.html) を利用することもできます。

## 収集しているニュースチャンネル

ページ (index.html) をロードすると下部に表示されます。


