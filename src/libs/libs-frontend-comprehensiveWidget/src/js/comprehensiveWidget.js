'use strict';
(function ($) {
  $.fn.comprehensiveWidget = function (id, options) {
    debugger;
    $(this).empty();
    let widget = {
      iframeID: id,
      scrollingContainer: undefined,
      scrollingLeoItem: undefined,
      scrollItemPublishID: undefined,
      expandContainer: undefined,
      expandLeoItem: undefined,
      leoLeftItem: undefined,
      leoRightItem: undefined

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

        //add div to the main container
        $container.append($div);

        if (data.leftSideData.type == "html") {
          $($container1).css("position", "sticky");
          // $($container1).css("overflow", "auto");
          resizeGridContainers(false, $container1);
          $container1.append(data.leftSideData.htmlData);
          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
        } else {
          widget.leoLeftItem = setDataAndCreateGrids(data.leftSideData, $container1[0]);
          widget.leoRightItem = setDataAndCreateGrids(data.rightSideData, $container2[0]);
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

      //let the height be scroll for both , manually set the height so as to prevent rendering of the grid on changing from full screen and min screen and vice versa
      height = "100%";

      let uiStyle = {
        height: height,
        horizontalAlignment: 'center'
      };

      //wait for grid to load
      waitForEl(container, ".leonardoPlayerContainer", function (args) {
        args.css("overflow", "hidden");  // to hide its scrollbar
        waitForEl(args, ".l-act-player.presentation ", function (args1) {
          args.css("margin-top", "-10px");  //to solve top mismatch issue
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
            if (Object.keys(widget.expandLeoItem).length !== 0 &&
              Object.keys(widget.scrollingLeoItem).length !== 0) {
              resizeGridContainers(false, widget.scrollingContainer);
            }

            // check if current leoItem if is of scroll , resize it appropriately
            // if (Object.keys(widget.leoLeftItem).length !== 0 &&
            // widget.leoLeftItem.props.uid == widget.scrollItemPublishID) {
            //   resizeGridContainers(false, widget.scrollingContainer);
            // } else if (Object.keys(widget.leoRightItem).length !== 0 &&
            //   widget.leoRightItem.props.uid == widget.scrollItemPublishID) {
            //   resizeGridContainers(false, widget.scrollingContainer);
            // }
            // let container, height;
            // let found = false;
            // // dont know the call back is of left or right so keep guessing
            // if (Object.keys(widget.leoLeftItem).length !== 0) {
            //   container = publishIdAndContainer.get(widget.leoLeftItem.props.uid);
            //   if (container != undefined) {
            //     found = true;
            //   }
            //   height = widget.leoLeftItem.getRequiredDimension().height;
            // }
            // if (!found && Object.keys(widget.leoRightItem).length !== 0) {
            //   container = publishIdAndContainer.get(widget.leoRightItem.props.uid);
            //   if (container != undefined) {
            //     found = true;
            //   }
            //   height = widget.leoRightItem.getRequiredDimension().height;
            // }
            // if (found) {
            //   height += 17 + parseInt($(container).css("padding-top")) + parseInt($(container).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
            //   $(container).css("height", height + "px");
            // }



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
        if (Object.keys(widget.leoRightItem).length === 0 && widget.leoRightItem.constructor === Object) {
          //abs
        } else {
          let container = publishIdAndContainer.get(widget.leoRightItem.props.uid)
          if (container != undefined) {
            let height = widget.leoRightItem.getRequiredDimension().height;
            height += 17 + parseInt($(container).css("padding-top")) + parseInt($(container).css("padding-bottom"));  // 17 for scroll bar , 20 for container padding
            $(container).css("height", height + "px");
          }
        }
      });
    };
    let resizeGridContainers = function (isFullScreen, scrollContainer) {


      if (isFullScreen) {
        //set height of container1 and container2 based on the height of bottom bar and top nav bar
        let bottomBarHt = $('.bottomBar-cosmatengine').outerHeight(true);
        let topBarHt = $('.topBar-cosmatengine').outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;
        $('#container1', $container).css("height", height + "px");
        $('#container2', $container).css("height", height + "px");
        $('#placeholder').css('margin', '0');
        $('#placeholder').removeClass('ribbon-adjustments');
      } else {
        // set height of scroll container 
        let bottomBarHt = $('.app-footer', $(window.parent.document)).outerHeight(true);
        let topBarHt = $('.navbar', $(window.parent.document)).outerHeight(true);
        let sum = bottomBarHt + topBarHt + 10;   //10px buffer
        let height = window.parent.innerHeight - sum;
        let gridHeight = -1;

        // check container height should not be greater than the grid hieght 

        if (Object.keys(widget.scrollingLeoItem).length !== 0) {
          gridHeight = widget.scrollingLeoItem.getRequiredDimension().height;
        }
        if (gridHeight !== -1 && gridHeight < height) {
          // grid is smaller than viewport height, dont set absolute height
          $(scrollContainer).css("height", "100%");
        } else {
          $(scrollContainer).css("height", height + "px");
        }

        ////////////////////reset the height of the expand grid as well
        if (Object.keys(widget.expandLeoItem).length !== 0) {
          let height = widget.expandLeoItem.getRequiredDimension().height;
          height += 17 + parseInt($(widget.expandContainer).css("padding-top")) + parseInt($(widget.expandContainer).css("padding-bottom"));  // 17 for scroll bar
          $(widget.expandContainer).css("height", height + "px");
        }
      }
    };

    window.parent.onscroll = function () {
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
    };

    window.parent.onresize = function () {
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