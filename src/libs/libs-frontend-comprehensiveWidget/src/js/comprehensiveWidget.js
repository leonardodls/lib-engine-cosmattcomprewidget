'use strict';
(function ($) {
  $.fn.comprehensiveWidget = function (id, options) {
    debugger;

    $(this).empty();
    let widget = {
      iframeID: id,
      options: options,
      scrollingContainer: undefined,
      scrollingLeoItem: undefined,
      scrollItemPublishID: undefined,
      expandContainer: undefined,
      expandLeoItem: undefined,
      leoLeftItem: undefined,
      leoRightItem: undefined,
      hasHTML: false,
      isFullScreen : false

    };

    
    // //temp hack to know if full screen, reset call bug issue
    // if( $('.topBar-cosmatengine').is(":visible")){
    //   widget.isFullScreen = true;
    // }


    let type, $container1, $container2, viewJSON, data;
    // let leoRightItem;
    var publishIdAndContainer = new Map();
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

        $div.append('<div class="fill-space"></div>');
        $container1 = $('<div id="container1" class="left-container sideBySide"></div>');
        $div.append($container1);
        //append splitter and make it resizable
        if (data.resizer) {
          // //$div.append($('<div class="splitter"></div>'));
          // $container1.resizable({
          //   handleSelector: ".splitter",
          //   resizeHeight: false
          // });
        }

        //adding right container
        $container2 = $('<div id="container2" class="right-container sideBySide"></div>');
        $div.append($container2);
        $div.append('<div class="fill-space"></div>');

        //add div to the main container
        $container.append($div);

        if (data.leftSideData.type == "html") {
          widget.hasHTML = true;
          $($container1).css("position", "sticky");
          // $($container1).css("overflow", "auto");
          if (data.leftSideData.height == "scroll") {
            widget.scrollingContainer = $container1[0];
          } else {
            widget.expandContainer = $container1[0];
          }
          $container1.append(data.leftSideData.htmlData);
          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
          
          //if is 
          resizeGridContainers(widget.isFullScreen, $container1);
        } else {

          widget.leoLeftItem = setDataAndCreateGrids(data.leftSideData, $container1[0]);
          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
          setUpContainers($container1);
        }
      }
      updateContainerItemProperties();
    };

    let setUpContainers = function ($container1) {

      $container1.css('padding', '0px');
      $container1.css('background', 'none');

    };
    let updateContainerItemProperties = function () {
      //temporarily removing
      return;
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

      //let the height be scroll for both , manually set the height so as to prevent rendering of the grid on changing from full screen and min screen and vice versa
      height = "100%";

      let uiStyle = {
        height: height,
        // horizontalAlignment: 'center',
        widgetStyles: { 'box-shadow': 'none', 'border': 'none', 'margin': '0px' }
      };

      //wait for grid to load
      waitForEl(container, ".leonardoPlayerContainer", function (args) {
        args.css("overflow", "hidden");  // to hide its scrollbar
        waitForEl(args, ".l-act-player.presentation ", function (args1) {
          // args.css("margin-top", "-14px");  //to solve top mismatch issue
        });
      });
      if (gridData.height == "scroll") {
        //default sticky for small resolution
        $(container).css("position", "sticky");
        widget.scrollingContainer = container;
        widget.scrollItemPublishID = gridData.publishedId;
        widget.scrollingLeoItem = createGrid(gridData.publishedId, container, undefined, uiStyle, false);
        return widget.scrollingLeoItem;
      } else {
        publishIdAndContainer.set(gridData.publishedId, container);
        widget.expandContainer = container;
        widget.expandLeoItem = createGrid(gridData.publishedId, container, undefined, uiStyle, false);
        return widget.expandLeoItem;
      }
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
      if (Object.keys(widget.leoRightItem).length === 0 && widget.leoRightItem.constructor === Object) {
        $container.trigger("widgetResized", [args]);
      } else {
        let dim = widget.leoRightItem.getRequiredDimension();
        $container.trigger("widgetResized", { height: dim.height });
      }
    };
    let widgetChangeHandler = function (range, data, args) {
      $container.trigger("gridChanged", [range, data, args]);
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



            if (widget.isFullScreen) {
              resizeGridContainers(true);
              return;
            }

            // if not fullscreen
            //if 2nd call back with both ready

            // if html then only wait for scrolling item 
            if (widget.hasHTML) {
              //only right is present
              resizeGridContainers(false, widget.scrollingContainer);
            } else if (Object.keys(widget.expandLeoItem).length !== 0 &&
              Object.keys(widget.scrollingLeoItem).length !== 0) {
              resizeGridContainers(false, widget.scrollingContainer);
            }




          },
          widgetDimensionChange: widgetDimensionChangeHandler,
          change: widgetChangeHandler,
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
        widget.isFullScreen = true;
        resizeGridContainers(true);
      });
      $container.on("minScreenEvent", function (event, args) {
        widget.isFullScreen = false;
        //scrolling container position gets changed as by default window is scrolled , so scrolling back to top
        $(window.parent).scrollTop(0);

        if (widget.leoRightItem && Object.keys(widget.leoRightItem).length === 0) {
          //abs
        } else {
          // let container = publishIdAndContainer.get(widget.leoRightItem.props.uid)
          // if (container != undefined) {
          //   let height = widget.leoRightItem.getRequiredDimension().height;
          //   height += 17 + parseInt($(container).css("padding-top")) + parseInt($(container).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
          //   $(container).css("height", height + "px");
          // }
          

          // reexpand the expanding container
          if (widget.expandContainer != undefined && widget.expandLeoItem && Object.keys(widget.expandLeoItem).length !== 0 ) {
            let height = widget.expandLeoItem.getRequiredDimension().height;
            height += 17 + parseInt($(widget.expandContainer).css("padding-top")) + parseInt($(widget.expandContainer).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
            $(widget.expandContainer).css("height", height + "px");

          }


        }
      });
    };
    let resizeGridContainers = function (isFullScreen, scrollContainer) {
      try {
        let ht = $('.k-spreadsheet-view-size', $('#container1', $container)).outerWidth(true);
        if (ht != undefined) {
          $('#container1', $container).css('max-width', ht + 30 + "px");
        }
        let ht1 = $('.k-spreadsheet-view-size', $('#container2', $container)).outerWidth(true);
        if (ht1 != undefined) {
          //since it has padding present extra 20 px required
          $('#container2', $container).css('max-width', ht1 + 50 + "px");
        }
        if (isFullScreen) {
          //set height of container1 and container2 based on the height of bottom bar and top nav bar
          let bottomBarHt = $('.bottomBar-cosmatengine').outerHeight(true);
          let topBarHt = $('.topBar-cosmatengine').outerHeight(true);
          let sum = bottomBarHt + topBarHt + 10;   //10px buffer
          let height = window.parent.innerHeight - sum;



          let gridHeight = -1;
 // check container height should not be greater than the grid hieght 
 if (widget.leoLeftItem && Object.keys(widget.leoLeftItem).length !== 0) {
  gridHeight = widget.leoLeftItem.getRequiredDimension().height;
}
          // 8px buffer
        let setheight = gridHeight + parseInt($('#container1').find('.l-act-player').css('margin-bottom')) + 8 +
        parseInt($('#container1').css("padding-top")) + parseInt($('#container1').css("padding-bottom"));

      if (gridHeight !== -1 && setheight < height) {
        debugger;
        // let setheight = $(scrollContainer).find('.l-act-player').outerHeight(true) +
        // parseInt($(scrollContainer).css("padding-top")) + parseInt($(scrollContainer).css("padding-bottom"));
        // grid is smaller than viewport height, dont set absolute height
        $('#container1').css("height", setheight + "px");
      } else {
        $('#container1').css("height", height + "px");
      }



       gridHeight = -1;
 // check container height should not be greater than the grid hieght 
 if (widget.leoRightItem && Object.keys(widget.leoRightItem).length !== 0) {
  gridHeight = widget.leoRightItem.getRequiredDimension().height;
}
          // 8px buffer
         setheight = gridHeight + parseInt($('#container2').find('.l-act-player').css('margin-bottom')) + 8 +
        parseInt($('#container2').css("padding-top")) + parseInt($('#container2').css("padding-bottom"));

      if (gridHeight !== -1 && setheight < height) {
        debugger;
        // grid is smaller than viewport height, dont set absolute height
        $('#container2').css("height", setheight + "px");
      } else {
        $('#container2').css("height", height + "px");
      }



          // $('#container1', $container).css("height", height + "px");
          // $('#container2', $container).css("height", height + "px");


          $('#placeholder').css('margin', '0');
          $('#placeholder').removeClass('ribbon-adjustments');
        } else {

          if (widget.hasHTML) {
            // left container
            if (widget.options.view.sidebyside.leftSideData.height == "scroll") {
              setScrollContainerMS(scrollContainer);
            } else {
              let ht = $(widget.expandContainer).find('.html-viewer').outerHeight(true);
              $(widget.expandContainer).css("height", ht + "px");
            }

            // right item will be there
            if (widget.options.view.sidebyside.rightSideData.height == "scroll") {
              if (widget.scrollingLeoItem && widget.leoRightItem == widget.expandLeoItem) {
                setScrollContainerMS(scrollContainer);
              }
            } else {
              setExpandContainerMS();
            }
            return;
          }

          setScrollContainerMS(scrollContainer);
          setExpandContainerMS();

        }

      } catch (error) {
        console.log(error);
      }
    };

    //MS stands for min screen
    let setScrollContainerMS = function (scrollContainer) {
      try {
        // set height of scroll container 
        let bottomBarHt = $('.app-footer', $(window.parent.document)).outerHeight(true);
        let topBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;
        let gridHeight = -1;

        // check container height should not be greater than the grid hieght 


        if (widget.scrollingLeoItem && Object.keys(widget.scrollingLeoItem).length !== 0) {
          gridHeight = widget.scrollingLeoItem.getRequiredDimension().height;
        }

        // 8px buffer
        let setheight = gridHeight + parseInt($(scrollContainer).find('.l-act-player').css('margin-bottom')) + 8 +
          parseInt($(scrollContainer).css("padding-top")) + parseInt($(scrollContainer).css("padding-bottom"));

        if (gridHeight !== -1 && setheight < height) {
          debugger;
          // let setheight = $(scrollContainer).find('.l-act-player').outerHeight(true) +
          // parseInt($(scrollContainer).css("padding-top")) + parseInt($(scrollContainer).css("padding-bottom"));
          // grid is smaller than viewport height, dont set absolute height
          $(scrollContainer).css("height", setheight + "px");
        } else {
          $(scrollContainer).css("height", height + "px");
        }

      } catch (error) {
        console.log(error);
      }
    };
    //MS stands for min screen
    let setExpandContainerMS = function () {
      ////////////////////reset the height of the expand grid as well
      if (widget.expandLeoItem && Object.keys(widget.expandLeoItem).length !== 0) {
        let height = widget.expandLeoItem.getRequiredDimension().height;
        height += 17 + parseInt($(widget.expandContainer).css("padding-top")) + parseInt($(widget.expandContainer).css("padding-bottom"));  // 17 for scroll bar
        $(widget.expandContainer).css("height", height + "px");
      }
    };
    window.parent.onscroll = function () {
      try {
        let iframeID = $('.pluginArea').data('widgetData').iframeID;
        let iframeTop = $(window.parent.document).find('#' + 'iframe_' + iframeID).offset().top; //209
        let navBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
        let scrollingContainer = $('.pluginArea').data('widgetData').scrollingContainer;

        let scrollingContainerHeight = $(scrollingContainer).outerHeight(true);
        let iframeHeight = $(window.parent.document).find('#' + 'iframe_' + iframeID).outerHeight(true);
        let bottomBarHeight = $('.bottomBar-cosmatengine').outerHeight(true);

        // 17 px for scroll bar and 10 px padding bottom
        let distFromTop = iframeTop + iframeHeight - scrollingContainerHeight - bottomBarHeight - 17;
        if (window.parent.pageYOffset >= distFromTop) {
          //set some top
          $(scrollingContainer).animate({
            top: distFromTop + "px"
          }, 0, 'linear');
        } else {
          $(scrollingContainer).animate({
            top: window.parent.pageYOffset - iframeTop + navBarHt + 0 + "px"
          }, 0, 'linear');
        }

      } catch (error) {
        console.log(error);
      }
    };

    window.parent.onresize = function () {
      widgetDimensionChangeHandler();
      let isFullScreen = $('.pluginArea').data('widgetData').isFullScreen;
      //if full screen resize both containers
      //if not full screen rezise only scrolling container
      if (isFullScreen) {
        resizeGridContainers(isFullScreen);
      } else {

        let scrollingContainer = $('.pluginArea').data('widgetData').scrollingContainer;
        resizeGridContainers(isFullScreen, scrollingContainer);
      }
    };

    addListeners();
    createContainer();

    $(this).data('widgetData', widget);

    return {
      this: this,
      updateInputs: updateInputs,
      markAnswers: markAnswers,
      leoLeftItem: widget.leoLeftItem,
      leoRightItem: widget.leoRightItem
    };


  }
})(jQuery);