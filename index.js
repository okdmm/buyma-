const puppeteer = require('puppeteer');
const fs = require('fs');
const csvSync = require('csv-parse/lib/sync');
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const csvfile = 'list.csv';
  const data = fs.readFileSync(csvfile);
  const res = csvSync(data);

  const USER_ID = process.env.MY_USER_ID;
  const PASSWORD = process.env.MY_PASSWORD;

  await page.setViewport({
    width: 1200,
    height: 800,
  });

  // buymaにアクセス
  await page.goto('https://www.buyma.com/my/');
  page.waitForNavigation();
  console.log('ログインページへ');

  // loginページへ
  //await page.waitForSelector('.fab-l-header > .fab-l-header__contents > .fab-header__nav > .fab-header__nav-btn--my > #js-pc-header-login-link');
  //await page.click('.fab-l-header > .fab-l-header__contents > .fab-header__nav > .fab-header__nav-btn--my > #js-pc-header-login-link');
  //console.log('トップページ => ログインページ')

  // login情報入力
  await page.waitForSelector('#login_form > form > #login_InputForm > dd > #txtLoginId');
  await page.type('#login_form > form > #login_InputForm > dd > #txtLoginId', USER_ID);
  await page.type('#login_form > form > #login_InputForm > dd > #txtLoginPass', PASSWORD);
  
  // login
  await page.click('.login_Section > #login_form > form > div > #login_do');
  console.log('ログインに成功しました');
  console.log('ログインページ => マイページ');

  // 出品ページへ
  await page.waitForSelector('.my-page-menu > ul > li:nth-child(4) > a > span:nth-child(2)');
  await page.click('.my-page-menu > ul > li:nth-child(4) > a > span:nth-child(2)');
  console.log('マイページ => 出品ページ')
  await page.goto('https://www.buyma.com/my/itemedit');

  // さらに出品ページ notBeta
  await page.waitForSelector('.bmm-c-heading-options > .bmm-c-heading-options__icon > .bmm-c-dropdown > a > .bmm-c-ico');
  await page.evaluate(()=>document.querySelector('.bmm-c-heading-options > .bmm-c-heading-options__icon > .bmm-c-dropdown > a > .bmm-c-ico').click());
  
  await page.waitForSelector('.bmm-c-heading-options > .bmm-c-heading-options__icon > .bmm-c-dropdown > .animate-enter-done > .bmm-c-dropdown__item:nth-child(1)');
  await page.click('.bmm-c-heading-options > .bmm-c-heading-options__icon > .bmm-c-dropdown > .animate-enter-done > .bmm-c-dropdown__item:nth-child(1)');
  page.waitForNavigation();
  console.log('出品ページ not beta');


  //------出品開始

  for(var s = 1; s < res.length; s++) {

    // カテゴリー

    await page.waitForSelector('.itemedit-tbl > tbody > tr > .itemedit-tbl__td > .popup_category');
    //await page.evaluate(()=>document.querySelector('.itemedit-tbl > tbody > tr > .itemedit-tbl__td > .popup_category').click());
    var category = res[s][4];
    var categories = category.split(" ");
    await page.click('.itemedit-tbl > tbody > tr > .itemedit-tbl__td > .popup_category');
    
    await page.waitForSelector('.cat_list');
    var list = await page.$$('#cat_list_wrap > .cat_list > dt');
    var datas = [];
    for (let i = 0; i < list.length; i++) {
      datas.push(await (await list[i].getProperty('textContent')).jsonValue())
    }
    var index = datas.indexOf(categories[0]) + 1;
    let firstSelector = '.cat_list:nth-child(' + index + ')  > dd > ul > li';

    var list = await page.$$(firstSelector);
    var datas = [];
    for (let i = 0; i < list.length; i++) {
      datas.push(await (await list[i].getProperty('textContent')).jsonValue())
    }

    index = datas.indexOf(categories[1]) + 1;
    let secondSelector = firstSelector + ':nth-child(' + index + ') > .cate_link';
    await page.click(secondSelector);
    if( categories[2] != "" ) {
      await page.waitForSelector('.popup_box > .inner > .cate_list > li');
      var thirdSelector = '.popup_box > .inner > .cate_list > li';
      var list = await page.$$(thirdSelector);
      var datas = [];
      for (let i = 0; i < list.length; i++) {
        datas.push(await (await list[i].getProperty('textContent')).jsonValue())
      }
      var index = datas.indexOf(categories[2]) + 1;
      thirdSelector += ':nth-child(' + index + ') > a';
      await page.waitForSelector(thirdSelector);
      await page.click(thirdSelector);
    }

    console.log('カテゴリー完了');

    // ブランド
    var bland = res[s][2];
    bland = bland.replace(/\(.*\)/,"");

    await page.click('.itemedit-tbl > tbody > tr > .itemedit-tbl__td > .popup_brand');
    await page.waitForSelector('.popup_box > .inner > .brand_suggest_box > #brand_suggest_inputTxt > input') ;
    await page.type('.popup_box > .inner > .brand_suggest_box > #brand_suggest_inputTxt > input', bland);
    await page.hover('.bm_auto_complete > ul > li');
    await page.waitForSelector('#my > .bm_auto_complete > ul > .suggest_selected');
    await page.click('#my > .bm_auto_complete > ul > .suggest_selected');
    console.log('ブランド完了');


    // 商品名
    var name = res[s][1];
    await page.waitForSelector('.bmm-c-table > tbody > .bmm-c-table__tr > .d_text_input_item_name > #item_name');
    await page.type('.bmm-c-table > tbody > .bmm-c-table__tr > .d_text_input_item_name > #item_name', name);
    console.log('商品名完了');

    // 画像
    var foldername = res[s][0];
    var folderdir = "img/" + foldername;
    var filepath = [];
    var files =  fs.readdirSync(folderdir);
    for(var i = 0; i < files.length; i++) {
      filepath.push(folderdir + "/" + files[i]);
      await page.waitForSelector('.fab-dialog__thumbs > .fab-dialog__thumb > .async-upload__thumb > .fab-dialog__thumb-drop-zone > input');
      const fileInput = await page.$('.fab-dialog__thumbs > .fab-dialog__thumb > .async-upload__thumb > .fab-dialog__thumb-drop-zone > input');
      await fileInput.uploadFile(folderdir + "/" + files[i]);
      console.log('画像アップロード');
      await page.waitFor(2000);
      console.log('商品画像完了');
    }

    // 色・サイズ

    // 色
    var colorPair = res[s][13];
    var colorPairs = colorPair.split("\n");
    var colorType = "ホワイト系";
    var colorName = "off-white";
    await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .cse-set > .itemedit-colorsize-btnwrap--2 > .js-popup-color-size');
    await page.click('.bmm-c-table__tr > .bmm-c-table__td > .cse-set > .itemedit-colorsize-btnwrap--2 > .js-popup-color-size');

    for(var j = 0; j < colorPairs.length; j++) {
      await page.waitForSelector('.csp-color-select__bubble > .csp-color-select__main > .js-color-size-color-wrapper > .csp-color-select__color-box > .csp-color-select__color-type')
      var colors = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('.csp-color-select__bubble > .csp-color-select__main > .js-color-size-color-wrapper > .csp-color-select__color-box > .csp-color-select__color-type'))
                  .map(o => {
                      return {
                          name: o.textContent
                      };
                  });        
      }, '.csp-color-select__bubble > .csp-color-select__main > .js-color-size-color-wrapper > .csp-color-select__color-box > .csp-color-select__color-type');
      for(let i = 0; i < colors.length; i++) {
        if(colors[i].name == colorPairs[j].split(",")[0] ) {
          let index = i + 1;
          var tmpSelector = ".csp-color-select__bubble > .csp-color-select__main > .js-color-size-color-wrapper > .csp-color-select__color-box:nth-child(" + index + ")";
          await page.waitForSelector(tmpSelector);
          await page.click(tmpSelector);
          break
        }
      }

      await page.waitForSelector('.csp-color-select > .csp-color-select__bubble > .csp-color-select__main > .csp-color-select__contents > .js-color-size-color-name')
      await page.type('.csp-color-select > .csp-color-select__bubble > .csp-color-select__main > .csp-color-select__contents > .js-color-size-color-name', colorPairs[j].split(",")[1]);
      await page.waitForSelector('.csp-color-select > .csp-color-select__bubble > .csp-color-select__main > .csp-color-select__contents > .js-add-color');
      await page.click('.csp-color-select > .csp-color-select__bubble > .csp-color-select__main > .csp-color-select__contents > .js-add-color');
    }
    console.log("色完了");

    //サイズ
    var sizePair = res[s][14];
    var sizePairs = sizePair.split("\n");
    if( sizePairs[0] == "FREE SIZE"){
      await page.click('.js-size-input-wrap > .csp-select > table > td > #rdoSelectSize2');
      await page.waitForSelector('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select')
      await page.click('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select')
      await page.select('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select', '3')
      await page.type('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select', '3')
    }else if( sizePairs[0] == "ONE SIZE") {
      await page.click('.js-size-input-wrap > .csp-select > table > td > #rdoSelectSize2');
      await page.waitForSelector('.js-color-size-addition-table > tbody > tr > td:nth-child(2) > select')
      await page.click('.js-color-size-addition-table > tbody > tr > td:nth-child(2) > select')
      await page.select('.js-color-size-addition-table > tbody > tr > td:nth-child(2) > select', 'o')
      await page.type('.js-color-size-addition-table > tbody > tr > td:nth-child(2) > select', 'o')
      await page.waitForSelector('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select')
      await page.click('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select')
      await page.type('.js-color-size-addition-table > tbody > tr > td:nth-child(3) > select', '3')
    }else if( sizePairs[0]== "指定なし") {
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table > .csp-size-column > .js-size-text', 'XS')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table > td > select')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text', 'S')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select', '2')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text', 'M')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select', '3')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text', 'L')
      
      await page.waitForSelector('.js-size-row-wrap > .js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td:nth-child(3)')
      await page.click('.js-size-row-wrap > .js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td:nth-child(3)')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select', '4')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text', 'XL')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select')
    }else if(sizePairs[0] == "inch") {
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-addition-header > .csp-table-size > select')
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-addition-header > .csp-table-size > select', '3')

      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table > .csp-size-column > .js-size-text')
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table > .csp-size-column > .js-size-text', '24')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table > td > select')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > .csp-size-column > .js-size-text', '26')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select', '2')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(3) > td > select', '2')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > .csp-size-column > .js-size-text', '28')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select', '3')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(4) > td > select', '3')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > .csp-size-column > .js-size-text', '32')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select', '4')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(5) > td > select', '4')
      
      await page.waitForSelector('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      await page.click('div > .js-size-input-wrap > .js-size-row-wrap > .csp-size-add > .js-add-size')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > .csp-size-column > .js-size-text', '34')
      
      await page.waitForSelector('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select')
      await page.click('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select')
      
      await page.select('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select', '5')
      
      await page.type('.js-color-size-addition-table > tbody > .js-color-size-size-table:nth-child(6) > td > select', '5')
    }else {
      await page.waitForSelector('div > .js-size-guide-toggle-area > .js-size-guide > div > .cursor_pointer')
      await page.hover('#components > div > div.js-size-input-wrap > div.js-size-row-wrap > div.js-use-size-guide > div > a');
      var sizeAreas = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('div > .js-size-guide-toggle-area > .js-size-guide > div > .cursor_pointer'))
                  .map(o => {
                      return {
                          name: o.textContent
                      };
                  });        
      }, 'div > .js-size-guide-toggle-area > .js-size-guide > div > .cursor_pointer');
      for(let i = 0; i < sizeAreas.length; i++) {
        if(sizeAreas[i].name == sizePairs[0] ) {
          let index = i + 1;
          var tmpSelector = "div > .js-size-guide-toggle-area > .js-size-guide > div > .cursor_pointer:nth-child(" + index + ")";
          await page.click(tmpSelector);
          break
        }
      }
    }

    // 色サイズ決定
    await page.waitForSelector('.js-color-size-popup-box > #components > div > .csp-decide > .fab-button--primary');
    await page.click('.js-color-size-popup-box > #components > div > .csp-decide > .fab-button--primary');

    // 色サイズ補足
    var sizeComp = res[s][6];
    await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .cse-detail > .itemedit-colorsize-desc > #item_color_size')
    await page.type('.bmm-c-table__tr > .bmm-c-table__td > .cse-detail > .itemedit-colorsize-desc > #item_color_size', sizeComp);
    
    // 商品コメント
    var comment = res[s][5];
    await page.type('.bmm-c-table > tbody > .bmm-c-table__tr > .d_text_input_item_comment > #item_comment', comment);
    console.log('商品コメント完了');

    // シーズン
    var season = res[s][15];
    await page.waitForSelector('#season > option');
    var option = "";
    var options = await page.evaluate(optionSelector => {
            return Array.from(document.querySelectorAll('#season > option'))
                .filter(o => o.value)
                .map(o => {
                    return {
                        name: o.text,
                        value: o.value
                    };
                });        
    }, '#season > option');

    for(let i = 0; i < options.length; i++) {
      if(options[i].name == season ) {
        option = options[i].value
      }
    }

    await page.click('tbody > .bmm-c-table__tr > .bmm-c-table__td > .bmm-c-form-select-p > #season');
    await page.select('tbody > .bmm-c-table__tr > .bmm-c-table__td > .bmm-c-form-select-p > #season', option);
    console.log('シーズン完了');


    // ブランド型番
    blandType = res[s][22].split(',');
    await page.type('.n_details_box > tbody > .style-number-tr > td > #style_number_0', blandType[0]);
    await page.type('.n_details_box > tbody > .style-number-tr > td > #identification_memos_0', blandType[1]);
    console.log('型番完了');

    // タグ
    //await page.click('tbody > .bmm-c-table__tr > .bmm-c-table__td > .itemedit-tag > .popup_tags')
    //await page.waitForSelector('.r_tag_select_box_content > .m_tag_selector > .m_menu_toolbar > li:nth-child(3) > a')
    //const pages = await browser.pages(); // get all open pages by the browser
    //var popup = pages[pages.length - 1];
    //await page.waitForSelector('.r_tag_select_box_content > .m_tag_selector > .m_menu_toolbar > li:nth-child(3) > a')
    //await popup.evaluate(()=>document.querySelector('.r_tag_select_box_content > .m_tag_selector > .m_menu_toolbar > li:nth-child(3) > a').click());
    //await page.waitForSelector('.m_tag_col > .m_tag > .m_tag_inner > .m_tag_checkbox > #\_r_tag_check_163_1')
    //await page.evaluate(()=>document.querySelector('.m_tag_col > .m_tag > .m_tag_inner > .m_tag_checkbox > #\_r_tag_check_163_1').click());
    //await page.waitForSelector('.r_tag_select_box_content > .m_brand_list_footer > .buttons > li > .m_tag_selector_submit');
    //const test = await popup.evaluate(() => {
    //  const item = document.querySelector('.r_tag_select_box_content > .m_brand_list_footer > .buttons > li');
    //  return item.innerText;
    //});
    //console.log(test)
    //await popup.waitForSelector('.r_tag_select_box_content > .m_brand_list_footer > .buttons > li > .m_tag_selector_submit')
    //await popup.evaluate(()=>document.querySelector('.r_tag_select_box_content > .m_brand_list_footer > .buttons > li > .m_tag_selector_submit').click());
    //console.log('タグ完了');

    // 商品価格

    var price = res[s][18];
    await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-price-input > .bmm-u-typo-size175 > #price');
    await page.type('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-price-input > .bmm-u-typo-size175 > #price', price);
    console.log('商品価格完了');

    // 配送方法

    var deliveryWays = res[s][20];
    var deliverWay = deliveryWays.split(" ");
    for(let i = 0; i < deliverWay.length; i++){
      var shippingSelector = ".js-shipping-method-table > tbody > tr > td > #shipping-method-checkbox" + deliverWay[i];
    await page.click(shippingSelector);
    }
    console.log('配送方法完了');

    // 関税
    var traiff = res[s][23];
    if( traiff != "なし") {
      if( traiff != "お客様負担") {
        if( traiff != "関税元払い") {
          await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty > .itemedit-duty__input > #itemedit_duty_flg');
          await page.click('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty > .itemedit-duty__input > #itemedit_duty_flg');
          await page.waitForSelector('.bmm-c-table__td > .itemedit-duty > .itemedit-duty__payment > .bmm-c-form-radio > #duty_type_refund');
          await page.click('.bmm-c-table__td > .itemedit-duty > .itemedit-duty__payment > .bmm-c-form-radio > #duty_type_refund');
        }
        else{
          await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty > .itemedit-duty__input > #itemedit_duty_flg');
          await page.click('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty > .itemedit-duty__input > #itemedit_duty_flg');
        }
      }
    }
    console.log('関税完了')


    // 参考価格
    var refPrice = res[s][19];
    await page.waitForSelector('[id="itemedit[reference_price_kbn]2"]')
    await page.click('[id="itemedit[reference_price_kbn]2"]')
    await page.waitForSelector('tbody > .bmm-c-table__tr > .bmm-c-table__td > div > #reference_price')
    await page.click('tbody > .bmm-c-table__tr > .bmm-c-table__td > div > #reference_price')
    await page.type('tbody > .bmm-c-table__tr > .bmm-c-table__td > div > #reference_price', refPrice);
    console.log("参考価格完了")

    // 数量
    var quantity = res[s][21];
    await page.type('.bmm-c-table > tbody > .bmm-c-table__tr > .bmm-c-table__td > #pieces', quantity);
    console.log('数量完了')

    // 購入期限
    var deadLine = res[s][7];
    await page.focus('.bmm-c-table > tbody > .bmm-c-table__tr > .bmm-c-table__td > #itemedit_yukodate');
    await page.keyboard.press('Home');
    await page.keyboard.down('Shift');
    await page.keyboard.press('End');
    await page.keyboard.press('Backspace');
    await page.keyboard.up('Shift');
    await page.type('.bmm-c-table > tbody > .bmm-c-table__tr > .bmm-c-table__td > #itemedit_yukodate', deadLine);
    console.log("購入期限完了");
   
    // ショップ名
    var shopName = res[s][10];
    await page.type('.bmm-c-table > tbody > .bmm-c-table__tr > .bmm-c-table__td > #itemedit_konyuchi', shopName)
    await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area')
    await page.click('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area')
    
    // 買付地
    var landPurchase = res[s][9];
    var landPurchases = landPurchase.split(":");

    if(landPurchases[0] == "国内") {
      // 1回目の地域選択！
      await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area');
      var option = "";
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, '.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area > option');
      for(let i = 0; i < options.length; i++) {
        if(options[i].name == landPurchases[1] ) {
          option = options[i].value;
          break;
        }
      }
      await page.click('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area');
      await page.select('.bmm-c-table__tr > .bmm-c-table__td > div:nth-child(3) > .bmm-c-form-select-p > #itemedit_purchase_area', option);
    }
    else {
    //海外の場合
      await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-radio > #rdoMyActArea2');
      await page.click('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-radio > #rdoMyActArea2');
      // 1回目の地域選択！
      await page.waitForSelector('#itemedit_purchase_area');
      var option = "";
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('#itemedit_purchase_area > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, '#itemedit_purchase_area > option');
      for(let i = 0; i < options.length; i++) {
        if(options[i].name == landPurchases[1] ) {
          option = options[i].value;
          break;
        }
      }
      await page.click('#itemedit_purchase_area');
      await page.select('#itemedit_purchase_area', option);

      // 2回目の地域選択！
      await page.waitForSelector('.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break')
      await page.click('.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break')

      var option = "";
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, '.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break > option');
      for(let i = 0; i < options.length; i++) {
        if( options[i].name == landPurchases[2] ) {
          option = options[i].value
        }
      }
      await page.click('.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break');
      await page.select('.bmm-c-table__td > .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .js-city-select', option);

      if( landPurchases[3] != "") {
        await page.waitForSelector('.itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break > option');

        var option = "";
        var options = await page.evaluate(optionSelector => {
          return Array.from(document.querySelectorAll('.itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break > option'))
                    .filter(o => o.value)
                    .map(o => {
                        return {
                            name: o.text,
                            value: o.value
                        };
                    });        
        }, '.itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break > option');
        for(let i = 0; i < options.length; i++) {
          if(options[i].name == landPurchases[3] ) {
            option = options[i].value
          }
        }
        await page.click('.itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break');
        await page.select('.itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break', option);
      }
    }
    console.log("買付地完了");


    //発送地
    var dispatchPlace = res[s][11];
    var dispatchPlaces = dispatchPlace.split(":");

    if(dispatchPlaces[0] == "国内") {
      // 国内
      await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty__toggle-section > .bmm-c-form-select-p > #itemedit_shipping_region_japan_ > option');
      var option = "";
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty__toggle-section > .bmm-c-form-select-p > #itemedit_shipping_region_japan_ > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, '.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty__toggle-section > .bmm-c-form-select-p > #itemedit_shipping_region_japan_ > option');
      for(let i = 0; i < options.length; i++) {
        if(options[i].name == dispatchPlaces[1] ) {
          option = options[i].value
        }
      }
      await page.click('.bmm-c-table__tr > .bmm-c-table__td > .itemedit-duty__toggle-section > .bmm-c-form-select-p > #itemedit_shipping_region_japan_');
      await page.select('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-select-p:nth-child(3) > #hasso_foreign', option);
    }else{
    //海外の場合
      var firstDispatchSelector = '.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-select-p > #hasso_foreign';
      var seconDispatchSelector = '#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break';
      var thirdDispatchSelector = '#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break';

      await page.waitForSelector('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-radio > #rdoMyHassoArea2')
      await page.click('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-radio > #rdoMyHassoArea2')

      // 1回目の地域選択！
      await page.waitForSelector(firstDispatchSelector);
      await page.click(firstDispatchSelector);
      var option = "";
      var firstoption = firstDispatchSelector + ' > option';
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('.bmm-c-table__tr > .bmm-c-table__td > .itemedit__mgb5 > .bmm-c-form-select-p > #hasso_foreign > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, firstoption);
      for(let i = 0; i < options.length; i++) {
        if(options[i].name == dispatchPlaces[1] ) {
          option = options[i].value;
          break;
        }
      }
      await page.click(firstDispatchSelector);
      await page.select(firstDispatchSelector, option);


      // 2回目の地域選択！
      await page.waitForSelector('#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break')
      await page.click('#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break')
      var option = "";
      var options = await page.evaluate(optionSelector => {
        return Array.from(document.querySelectorAll('#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .bmm-c-form-select-p > .MP_break > option'))
                  .filter(o => o.value)
                  .map(o => {
                      return {
                          name: o.text,
                          value: o.value
                      };
                  });        
      }, seconDispatchSelector +  ' > option');
      for(let i = 0; i < options.length; i++) {
        if( options[i].name == dispatchPlaces[2] ) {
          option = options[i].value
        }
      }
      await page.select(seconDispatchSelector, option);

      // 3回目の地域選択!!
      if( dispatchPlaces[3] != '') {
        await page.waitForSelector(thirdDispatchSelector + ' > option');
        var option = "";
        var options = await page.evaluate(optionSelector => {
          return Array.from(document.querySelectorAll('#purchase_hasso_msg + .itemedit__mgb5 > .js-area-select-detail-view > .js-city-select-detail-view > .bmm-c-form-select-p > .MP_break > option'))
                    .filter(o => o.value)
                    .map(o => {
                        return {
                            name: o.text,
                            value: o.value
                        };
                    });        
        }, thirdDispatchSelector + ' > option');
        for(let i = 0; i < options.length; i++) {
          if(options[i].name == dispatchPlaces[3] ) {
            option = options[i].value
          }
        }
        await page.click(thirdDispatchSelector);
        await page.select(thirdDispatchSelector, option);
      }
    }
    
    // 出品---------
    

    // 下書き
    await page.waitForSelector('#chkForm > .bmm-l-sec > .bmm-l-area > .bmm-c-box-center > #draftButton');
    await page.click('#chkForm > .bmm-l-sec > .bmm-l-area > .bmm-c-box-center > #draftButton');
    console.log('下書きを保存');
    
    page.waitForNavigation();
    await page.waitForSelector('.n_PageArea > .n_MySection > .fab-design-mg--lr30 > .fab-design-mg--t20 > .fab-button')
    await page.click('.n_PageArea > .n_MySection > .fab-design-mg--lr30 > .fab-design-mg--t20 > .fab-button')
    console.log("出品リストへ戻る");
    
    page.waitForNavigation();
    await page.waitForSelector('div > .my-page-menu > ul > li:nth-child(5) > a')
    await page.click('div > .my-page-menu > ul > li:nth-child(5) > a')
    page.waitForNavigation();

  // 出品ルーティン終了
  }
  //// カテゴリ

  console.log("出品完了");

  await browser.close();
})();

