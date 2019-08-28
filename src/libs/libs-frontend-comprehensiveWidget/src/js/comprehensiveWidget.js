'use strict';

(function ($) {

  $.fn.comprehensiveWidget = function (id, options) {
    // replace this data --
    // newHints -resources  - leonardoJSON  -- data 

    debugger;



    $(this).empty();
    let widget = {};
    widget.iframeID = id;
    let type, $container1, $container2, viewJSON, data;
    let leoLeftItem, leoRightItem;

    var self = this;

    var publishIdAndContainer = new Map();
    var itemReady;
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

        if(data.leftSideData.type == "html"){
          $($container1).css("position", "sticky");
          resizeGridContainers(false, $container1);
          $container1.append(data.leftSideData.htmlData);
          leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
        }else{
          leoLeftItem = setDataAndCreateGrids(data.leftSideData, $container1[0]);
          leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
        }

        
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

    let setDataAndCreateGrids = function (gridData, container, forceScroll) {

      let height;
      if (gridData.height == "scroll" || forceScroll) {
        height = "100%";
      } else {
        // height = "expand";
        //let the height be scroll for both , manually set the height so as to prevent rendering of the grid on changing from full screen and min screen and vice versa
        height = "100%";
      }

      let uiStyle = {
        height: height,
        horizontalAlignment: 'center'
      };



      if (gridData.height == "scroll") {
        // hideScrollContainers.push(container);  //spreadsheet bug , cannot be used instead below waitForEl used as alternative

        //wait for grid to load and then set is overflow to hidden
        waitForEl(container, ".leonardoPlayerContainer", function (args) {
          args.css("overflow", "hidden");
        });

        //default sticky for small resolution
        $(container).css("position", "sticky");

        // 50 px top header , 34 px footer  , 17 px for scrollbar
        // $(container).css("height", "calc(100vh - 101px)");

        // let height = window.parent.innerHeight - sum;
        resizeGridContainers(false, container)
        // $(container).css("height", height + "px");

        // top to be 50px header + 6px buffer
        $(container).css("top", "56px");
        // for auto start end align 
        // $(container).css("height", "100%");
      } else {
        // setHeightContainers.push()
        publishIdAndContainer.set(gridData.publishedId, container);
        // setHeightContainers.push(container, gridData.publishedId);
      }



      

      debugger;
      return createGrid(gridData.publishedId, container, undefined, uiStyle, false);
    };

    let waitForEl = function (container, selector, callback) {
      if ($(container).find(selector).length) {
        callback($(container).find(selector));
      } else {
        setTimeout(function () {
          waitForEl(container, selector, callback);
        }, 100);
      }
    };


    let widgetDimensionChangeHandler = function (args) {
      if (Object.keys(leoRightItem).length === 0 && leoRightItem.constructor === Object) {
        $container.trigger("widgetResized", [args]);
      } else {
        let dim = leoRightItem.getRequiredDimension();
        $container.trigger("widgetResized", { height: dim.height });
      }
    };


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
          ready: function (range, data) {
            if (Object.keys(leoRightItem).length === 0 && leoRightItem.constructor === Object) {
              //abs
            } else {
              let container = publishIdAndContainer.get(leoRightItem.props.uid)
              if (container != undefined) {
                let height = leoRightItem.getRequiredDimension().height;
                height += 17 + parseInt($(container).css("padding-top")) + parseInt($(container).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
                $(container).css("height", height + "px");
              }
              // publishIdAndContainer.get()
              // leoRightItem.props.uid

            }
          },
          widgetDimensionChange: widgetDimensionChangeHandler,
          change: function (range, data) { console.log("Range is " + range + "and value is " + data) },
          reset: function resetItemHandler(args) { console.log("reset args", args) },
          hintReveal: function () {
            console.log("Hint Revealed")
          }
        };
      }


      if (window.LeonardoItems && window.LeonardoItems !== undefined) {

        return LeonardoItems.init({
          request: {
            item: publishedId
          }
        }, container, {
            events: callbacks,
            uiStyle: uiStyle,
            playerButtons: { visible: showPlayerButtons }
          });


      }

    };
    let updateInputs = function (params) {

    }

    let markAnswers = function (params) {
    };



    let addListeners = function () {

      $container.on("fullScreenEvent", function (event, args) {
        // reload right grid with forceScroll as true
        $container2 = $container.find('#container2');
        // $container2.empty();
        // setDataAndCreateGrids(data.rightSideData, $container2[0], true);
        resizeGridContainers(true);
      });

      $container.on("minScreenEvent", function (event, args) {
        if (Object.keys(leoRightItem).length === 0 && leoRightItem.constructor === Object) {
          //abs
        } else {
          let container = publishIdAndContainer.get(leoRightItem.props.uid)
          if (container != undefined) {
            let height = leoRightItem.getRequiredDimension().height;
            height += 17 + parseInt($(container).css("padding-top")) + parseInt($(container).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
            $(container).css("height", height + "px");
          }


        }

      });


    };
    let resizeGridContainers = function (isFullScreen, container) {
      if (isFullScreen) {
        //resize the containers based on the height of bottom bar and top nav bar
        let bottomBarHt = $('.bottomBar-cosmatengine').outerHeight(true);
        let topBarHt = $('.topBar-cosmatengine').outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;
        //set height of container1 and container2
        $('#container1', $container).css("height", height + "px");
        $('#container2', $container).css("height", height + "px");

        // todo check resize
        $('#placeholder').css('margin', '0');
        $('#placeholder').removeClass('ribbon-adjustments');

      } else {
        let bottomBarHt = $('.app-footer', $(window.parent.document)).outerHeight(true);
        let topBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;
        //set height of container1 and container2
        $(container).css("height", height + "px");

      }

    };

    window.parent.onscroll = function () {
      
      let iframeID = $('.pluginArea').data('widgetData').iframeID;
      let iframeTop = $(window.parent.document).find('#' + 'iframe_' + iframeID).offset().top; //209

      let navBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
      let container1Height = $('#' + 'container1').outerHeight(true);
      let iframeHeight = $(window.parent.document).find('#' + 'iframe_' + iframeID).outerHeight(true);
      let bottomBarHeight = $('.bottomBar-cosmatengine').outerHeight(true);
      // 17 px for scroll bar and 10 px padding bottom
      let distFromTop = iframeTop + iframeHeight - container1Height - bottomBarHeight - 17 - 20;
      if (window.parent.pageYOffset >= distFromTop) {
        //set some top
        $("#container1").animate({
          top: distFromTop + "px"
        }, 10);
      } else {
        $("#container1").animate({
          top: window.parent.pageYOffset - iframeTop + navBarHt + 0 + "px"
        }, 10);
      }
    };
    window.parent.onresize = function () {
    };


    addListeners();
    createContainer();

    $(this).data('widgetData', widget);
    return {
      this: this,
      updateInputs: updateInputs,
      markAnswers: markAnswers,
      leoLeftItem: leoLeftItem,
      leoRightItem: leoRightItem


    };
  }
})(jQuery);