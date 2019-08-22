'use strict';

(function ($) {

  $.fn.comprehensiveWidget = function (options) {
    // replace this data --
    // newHints -resources  - leonardoJSON  -- data 

    debugger;

    $(this).empty();
    let type, $container1, $container2, viewJSON, data;
    let hideScrollContainers = [];
    let $container = $(this);

    //TODO design options object 
    if (options == undefined) {
      type = 1;
    } else {
      viewJSON = options.view;
      if (viewJSON.hasOwnProperty("sidebyside")) {
        type = 1;
        data = viewJSON.sidebyside;

      }
    }
    /*
       type : 1 - for side by side
       */
    let defaults = {
      type: 1
    }

    let createContainer = function () {
      let $div = $('<div class="acc-comprehensive-container"></div>');
      if (type == 1) {
        //adding container
        $container1 = $('<div id="container1" class="left-container sideBySide"></div>');
        $div.append($container1);
        //append splitter and make it resizable
        if (data.resizer) {
          // $div.append($('<div class="splitter"></div>'));
          // $container1.resizable({
          //   handleSelector: ".splitter",
          //   resizeHeight: false
          // });
        }
        //adding right container
        $container2 = $('<div id="container2" class="right-container sideBySide"></div>');
        $div.append($container2);

        //add div to the main container
        $container.append($div);

        setDataAndCreateGrids(data.leftSideData, $container1[0]);
        setDataAndCreateGrids(data.rightSideData, $container2[0]);
      }
      updateContainerItemProperties();
    };

    let updateContainerItemProperties = function () {
      //default 50-50 seperation
      let width = data.ratio[0];
      if (width.includes("px") || width.includes("%")) {
        $container1.css("width", width);
      } else {
        $container1.css("width", width + "%");
      }

    };

    let setDataAndCreateGrids = function (gridData, container) {

      let height;
      if (gridData.height == "scroll") {
        height = "100%";
      } else {
        height = "expand";
      }

      let uiStyle = {
        height: height,
        horizontalAlignment: 'center'
      };


      createGrid(gridData.publishedId, container, undefined, uiStyle, false);

      $(container).find(".leonardoPlayerContainer").css("overflow", "hidden");


      if (gridData.height == "scroll") {
        hideScrollContainers.push(container);
        waitForEl(container, ".leonardoPlayerContainer", function (args) {

          args.css("overflow", "hidden");
        });
        $(container).css("position", "sticky");

        // 50 px top header , 34 px footer  , 17 px for scrollbar
        $(container).css("height", "calc(100vh - 101px)");
        // top to be 50px header + 6px buffer
        $(container).css("top", "56px");
        // for auto start end align 
        // $(container).css("height", "100%");
      }


    };

    var waitForEl = function (container, selector, callback) {
      if ($(container).find(selector).length) {
        callback($(container).find(selector));
      } else {
        setTimeout(function () {
          waitForEl(container, selector, callback);
        }, 100);
      }
    };

    // let onRender = function () {
    //   debugger;

    //   hideScrollContainers.forEach(function (container, index) {


    //   });

    // };


    let createGrid = function (publishedId, container, config, uiStyle, showPlayerButtons, callbacks) {

      if (publishedId == undefined) {
        // TODO throw error that id cannot be null
        publishedId = "WB3";
      }

      if (container == undefined) {
        // TODO throw error that container is required
        container = $container.find("#right-container")[0];
      }
      // if (config == undefined) {
      //   // TODO throw error that config is required
      //   config = inputData.rightPlayer;
      // }

      // to be set based on requirements 
      if (uiStyle == undefined) {
        // uiStyle = {
        //   height: "expand",
        //   horizontalAlignment: 'center'
        // };
      }

      if (showPlayerButtons == undefined) {
        showPlayerButtons = false;
      }


      // to be set based on requirements
      if (callbacks == undefined) {
        callbacks = {
          // render: onRender,
          change: function (range, data) { console.log("Range is " + range + "and value is " + data) },
          reset: function resetItemHandler(args) { console.log("reset args", args) },
          hintReveal: function () {
            console.log("Hint Revealed")
          }
        };
      }


      if (window.LeonardoItems && window.LeonardoItems !== undefined) {
        var finalUiStyle = Object.assign({}, uiStyle);
        // if ( params.options.data.meta && params.options.data.meta.renderOverrides ) {
        //   Object.assign(finalUiStyle, params.options.data.meta.renderOverrides);
        // }
        LeonardoItems.init({
          request: {
            item: publishedId
          }
        }, container, {
            events: callbacks,
            uiStyle: finalUiStyle,
            uiStyle: uiStyle,
            playerButtons: { visible: showPlayerButtons }
            // enableframeButton: params.options.data.meta.enableframeButton !== undefined ? params.options.data.meta.enableframeButton : false,

          });
      }



    };
    var updateInputs = function (params) {
            
      }

      var markAnswers = function (params) {
           

            
    };
    createContainer();
      
    return {
      this: this,
      updateInputs: updateInputs,
      markAnswers: markAnswers
    };
  }
})(jQuery);