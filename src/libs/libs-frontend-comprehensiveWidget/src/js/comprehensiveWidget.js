'use strict';
(function ($) {
  $.fn.comprehensiveWidget = function (id, options) {

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
      leftContainer: undefined,
      rightContainer: undefined,
      hasHTML: false,
      isFullScreen: false,
      debugMode: false
    };

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

        widget.leftContainer = $container1[0];
        widget.rightContainer = $container2[0];


        if (widget.options.view.sidebyside.leftSideData.height == "scroll") {
          widget.scrollingContainer = widget.leftContainer;
          widget.expandContainer = widget.rightContainer;
        } else {
          widget.scrollingContainer = widget.rightContainer;
          widget.expandContainer = widget.leftContainer;
        }

        if (data.leftSideData.type == "html") {
          widget.hasHTML = true;
          $container1.css("position", "sticky");
          $container1.css("margin-bottom", "0px");
          $container1.css("border", "1px solid #cae8ff");
          if (data.ratio) {
            $container1.css("width", data.ratio[0] + "%");
          } else {
            $container1.css("width", "55%");
          }

          $container2.css("min-width", "350px");

          // $($container1).css("overflow", "auto");
          if (data.leftSideData.height == "scroll") {
            widget.scrollingContainer = $container1[0];
          } else {
            widget.expandContainer = $container1[0];
          }
          $container1.append(data.leftSideData.htmlData);

          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0], true);

          //if is 
          resizeGridContainers(widget.isFullScreen, $container1);
        } else {

          widget.leoLeftItem = setDataAndCreateGrids(data.leftSideData, $container1[0]);
          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0], true);
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

    let setDataAndCreateGrids = function (gridData, container, isRight) {
      let height;

      //let the height be scroll for both , manually set the height so as to prevent rendering of the grid on changing from full screen and min screen and vice versa
      height = "scroll";

      let uiStyle = {
        height: height,
        // horizontalAlignment: 'center',
        widgetStyles: { 'box-shadow': 'none', 'border': 'none', 'margin': '0px' }
      };
      if (isRight) {

        uiStyle = {
          height: height,
          // horizontalAlignment: 'center',
          widgetStyles: {
            'box-shadow': '5px 5px 10px 0px #9b9a9a',
            'border': '10px solid #fef1e6',
            'margin': '0px',
          }
        }
      }
      //wait for grid to load
      // waitForEl(container, ".leonardoPlayerContainer", function (args) {
      //   args.css("overflow", "hidden");  // to hide its scrollbar
      //   waitForEl(args, ".l-act-player.presentation ", function (args1) {
      //     // args.css("margin-top", "-14px");  //to solve top mismatch issue
      //   });
      // });
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
    let widgetDimensionChangeHandler = function (eventData) {
      if (widget.debugMode) {
        debugger;
      }
      // console.log("Dimesnion changed for Uid : "+ eventData.uid);
      if (Object.keys(widget.leoRightItem).length === 0 && widget.leoRightItem.constructor === Object) {
        $container.trigger("widgetResized", [eventData]);
      } else {
        let dim = widget.leoRightItem.getRequiredDimension();
        $container.trigger("widgetResized", { height: dim.height });
      }
    };
    let widgetChangeHandler = function (range, data, args) {
      if (widget.debugMode) {
        debugger;
      }
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
              $container.trigger("pluginReady");
            } else if (Object.keys(widget.expandLeoItem).length !== 0 &&
              Object.keys(widget.scrollingLeoItem).length !== 0) {
              resizeGridContainers(false, widget.scrollingContainer);
              if (widget.debugMode) {
                console.log("Left  Item width req: " + widget.leoLeftItem.getRequiredDimension().width);
                console.log("Right Item height req: " + widget.leoLeftItem.getRequiredDimension().height);
                console.log("Right Item width req: " + widget.leoRightItem.getRequiredDimension().width);
                console.log("Right Item height req: " + widget.leoRightItem.getRequiredDimension().height);
                debugger;
              }
              console.log("GRIDS CREATED ... PLUGIN READY");
              $container.trigger("pluginReady");
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
        },
          {
            mode: "production"
          }
        );
      }
    };
    let updateInputs = function (params) {
    }
    let markAnswers = function (params) {
    };
    let addListeners = function () {
      $container.on("fullScreenEvent", function (event, args) {
        widget.isFullScreen = true;
        $('#placeholder').css('margin', '0');
        $('#placeholder').removeClass('ribbon-adjustments');
        resizeGridContainers(true);
      });
      $container.on("minScreenEvent", function (event, args) {
        widget.isFullScreen = false;
        $('#placeholder').css('margin', '');
        $('#placeholder').addClass('ribbon-adjustments');

        //scrolling container position gets changed as by default window is scrolled , so scrolling back to top
        $(window.parent).scrollTop(0);
        $(widget.scrollingContainer).css("top", "0px");
        resizeGridContainers();

      });
    };

    let setAdditonalHeightRequired = function ($container) {

      let mt = parseInt($container.css('margin-top'));
      let mb = parseInt($container.css('margin-bottom'));
      let pt = parseInt($container.css('padding-top'));
      let pb = parseInt($container.css('padding-bottom'));
      return mt + mb + pt + pb;
    }

    let resizeGridContainers = function (isFullScreen, scrollContainer) {

      if (widget.debugMode) {
        debugger;
      }
      try {
        let leftWd, leftHt, rightWd, rightHt;

        if (widget.leoLeftItem && Object.keys(widget.leoLeftItem).length !== 0) {
          leftWd = widget.leoLeftItem.getRequiredDimension().width;
          leftHt = widget.leoLeftItem.getRequiredDimension().height;
        }

        if (widget.leoRightItem && Object.keys(widget.leoRightItem).length !== 0) {
          rightWd = widget.leoRightItem.getRequiredDimension().width;
          rightHt = widget.leoRightItem.getRequiredDimension().height;
        }

        if (widget.isFullScreen) {
          ////WIDTH SETTINGS

          //HEIGHT SETTINGS
          //set height of container1 and container2 based on the height of bottom bar and top nav bar
          let bottomBarHt = $('.bottomBar-cosmatengine').outerHeight(true);
          let topBarHt = $('.topBar-cosmatengine').outerHeight(true);
          let sum = bottomBarHt + topBarHt + 10;   //10px buffer
          let height = window.parent.innerHeight - sum;

          let htmlHt;
          if (widget.hasHTML) {
            htmlHt = $(widget.leftContainer).children()[0].scrollHeight;
            htmlHt += setAdditonalHeightRequired($(widget.leftContainer));
          }

          (htmlHt < height) ? $(widget.leftContainer).css("height", htmlHt + "px") : $(widget.leftContainer).css('height', height + "px");

          $(widget.rightContainer).css('height', height + "px");
        } else {
          //Inline mode calculations

          //if verticaL scrollbar is visible then add 17px to width 
          //TBD
          // let vis = checkVerticalScroll($('.k-spreadsheet-scroller', $('#container2', $container)));
          ////WIDTH SETTINGS
          if (widget.hasHTML) {
            $(widget.leftContainer).css('max-width', "");
          } else {
            $(widget.leftContainer).css('max-width', leftWd + 17 + "px");
          }
          $(widget.rightContainer).css('max-width', rightWd + 17 + "px");


          //HEIGHT SETTINGS
          if (widget.leftContainer == widget.expandContainer) {
            // is html ?
            if (widget.hasHTML) {
              let htmlHt;
              htmlHt = $(widget.leftContainer).children()[0].scrollHeight;
              htmlHt += setAdditonalHeightRequired($(widget.leftContainer));
              $(widget.leftContainer).css("height", htmlHt + "px");
            } else {
              $(widget.leftContainer).css('height', leftHt + 17 + "px");
            }
          } else {
            //right is expand container
            $(widget.rightContainer).css('height', rightHt + 17 + "px");
          }

          if (widget.leftContainer == widget.scrollingContainer) {
            let isLeft = true;
            setScrollContainerMS(widget.leftContainer, isLeft);
          } else {
            //right is scroll container
            setScrollContainerMS(widget.rightContainer);
          }
        }


      } catch (error) {
        console.log(error);
      }

    };

    //MS stands for min screen
    let setScrollContainerMS = function (scrollContainer, isLeft) {
      try {
        let bottomBarHt = $('.app-footer', $(window.parent.document)).outerHeight(true);
        let topBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;

        let containerHt;
        if (isLeft) {
          if (widget.hasHTML) {
            containerHt = $(scrollContainer).children()[0].scrollHeight;
            containerHt += setAdditonalHeightRequired($(scrollContainer));
            //10px subracting as HTML appears to be to touching the bottom (grid has margin sso that does not require that )
            let htmlHeight = height - 10;
            (containerHt < htmlHeight) ? $(scrollContainer).css("height", containerHt + "px") : $(scrollContainer).css('height', htmlHeight + "px");
          } else {
            // give as much height required
            let leftHt = widget.leoLeftItem.getRequiredDimension().height;
            leftHt += 17;
            (leftHt < height) ? $(scrollContainer).css('height', leftHt + "px") : $(scrollContainer).css('height', height + "px");
          }

        } else {
          //isRight 
          let rightHt = widget.leoRightItem.getRequiredDimension().height;
          rightHt += 17;
          (rightHt < height) ? $(scrollContainer).css('height', rightHt + "px") : $(scrollContainer).css('height', height + "px");

        }

      } catch (error) {
        console.log(error);
      }

    };

    window.parent.onscroll = function () {
      if ($('.pluginArea').data('widgetData')) {
        try {
          let iframeID = $('.pluginArea').data('widgetData').iframeID;
          let iframeTop = $(window.parent.document).find('#' + 'iframe_' + iframeID).offset().top; //209
          let navBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
          let scrollingContainer = $('.pluginArea').data('widgetData').scrollingContainer;

          let scrollingContainerHeight = $(scrollingContainer).outerHeight(true);
          let iframeHeight = $(window.parent.document).find('#' + 'iframe_' + iframeID).outerHeight(true);
          let bottomBarHeight = $('.bottomBar-cosmatengine').outerHeight(true);

          // 17 px for scroll bar and 10 px padding bottom
          let distFromTop = iframeTop + iframeHeight - scrollingContainerHeight - bottomBarHeight;
          if (window.parent.pageYOffset >= distFromTop) {
            //top set when end of page reached
            $(scrollingContainer).animate({
              top: distFromTop + "px"
            }, 0, 'linear');
          } else {
            // top that is set when sticky , 10px extra space from top
            $(scrollingContainer).animate({
              top: window.parent.pageYOffset - iframeTop + navBarHt + 10 + "px"
            }, 0, 'linear');
          }

        } catch (error) {
          console.log(error);
        }
      }
    };

    window.parent.onresize = function () {
      if ($('.pluginArea').data('widgetData')) {
        widgetDimensionChangeHandler();
        let isFullScreen = $('.pluginArea').data('widgetData').isFullScreen;

        resizeGridContainers(isFullScreen);

      }
    };


    let destroy = function (params) {
      //reset all global listeners
      widget.leoRightItem.destroy();
      if (widget.leoLeftItem) {
        widget.leoLeftItem.destroy();
      }
      window.parent.onresize = function () { };
      window.parent.onscroll = function () { };
    }
    addListeners();
    createContainer();

    $(this).data('widgetData', widget);

    return {
      this: this,
      updateInputs: updateInputs,
      markAnswers: markAnswers,
      leoLeftItem: widget.leoLeftItem,
      leoRightItem: widget.leoRightItem,
      destroy: destroy
    };


  }
})(jQuery);