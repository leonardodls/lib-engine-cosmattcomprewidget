/*
 * -------------
 * Engine Module
 * -------------
 * 
 * Item Type: cosmatttsc Single Choice Quesion engine
 * Code: cosmatttsc
 * Interface: ENGINE
 
 *  ENGINE Interface public functions
 *  {
 *          init(),
 *          getStatus(),
 *          getConfig()
 *  }
 * 
 *
 * This engine is designed to be loaded dynamical by other applications (or  platforms). At the starte the function [ engine.init() ] will be called  with necessary configuration paramters and a reference to platform "Adapter"  which allows subsequent communuication with the platform.
 *
 * The function [ engine.getStatus() ] may be called to check if SUBMIT has been pressed or not - the response from the engine is used to enable / disable appropriate platform controls.
 *
 * The function engine.getConfig() is called to request SIZE information - the response from the engine is used to resize & display the container iframe.
 *
 *
 * EXTERNAL JS DEPENDENCIES : ->
 * Following are shared/common dependencies and assumed to loaded via the platform. The engine code can use/reference these as needed
 * 1. JQuery (2.1.1)
 * 2. Boostrap (TODO: version) 
 */

// 8:23 22/06/2017

define([
  'css!../../node_modules/bootstrap/dist/css/bootstrap.min.css',
  'css!../libs/libs-frontend-comprehensiveWidget/src/css/comprehensiveWidget.css',
  'css!../css/cosmattcomprewidget.css', //Custom styles of the engine (applied over bootstrap & front-end-core)
  'https://leonardo-sdk-stg.herokuapp.com/leonardo-items.js',
  // 'http://192.168.1.143:4080/leonardo-items.js',
  '../libs/libs-frontend-comprehensiveWidget/src/js/comprehensiveWidget.js'
], //Required by Rivets
  function (cosmattcomprewidgetTemplateRef) {


    cosmattcomprewidget = function () {

      "use strict";

      /*
       * Reference to platform's activity adaptor (initialized during init() ).
       */
      var activityAdaptor;

      /*
       * Internal Engine Config.
       */
      var __config = {
        MAX_RETRIES: 10,
        /* Maximum number of retries for sending results to platform for a particular activity. */
        RESIZE_MODE: "auto",
        /* Possible values - "manual"/"auto". Default value is "auto". */
        RESIZE_HEIGHT: "580" /* Applicable, if RESIZE_MODE is manual. If RESIZE_HEIGHT is defined in TOC then that will overrides. */
        /* If both config RESIZE_HEIGHT and TOC RESIZE_HEIGHT are not defined then RESIZE_MODE is set to "auto"*/
      };

      /*
       * Internal Engine State.
       */
      var __state = {
        currentTries: 0,
        /* Current try of sending results to platform */
        activityPariallySubmitted: false,
        /* State whether activity has been partially submitted. Possible Values: true/false(Boolean) */
        activitySubmitted: false,
        /* State whether activity has been submitted. Possible Values: true/false(Boolean) */
        radioButtonClicked: false /* State whether radio button is clicked.  Possible Values: true/false(Boolean) */
      };

      /*
       * Content (loaded / initialized during init() ).
       */
      var __content = {
        instructionText: "",
        score: {},
        appData: {},
        questionText: "",
        /* Contains the question obtained from content JSON. */
        optionsJSON: {},
        /* Contains all the options for a particular question obtained from content JSON. */
        answersJSON: {},
        /* Contains the answer for a particular question obtained from content JSON. */
        userAnswersJSON: {},
        /* Contains the user answer for a particular question. */
        activityType: null /* Type of FIB activity. Possible Values :- FIBPassage.  */
      };

      /*
       * Constants.
       */
      var __constants = {
        /* CONSTANT for PLATFORM Save Status NO ERROR */
        STATUS_NOERROR: "NO_ERROR",
        /* CONSTANTS for activity status */
        ACTIVITY_NOT_ATTEMPTED: "not_attempted",
        /* Activity not yet Attempted. */
        ACTIVITY_IN_PROGRESS: "in_progress",
        /* In Progress Activity. */
        ACTIVITY_PARTIALLY_CORRECT: "partially_correct",
        /* Partially Correct Activity. */
        ACTIVITY_CORRECT: "correct",
        /* Correct Activity. */
        ACTIVITY_INCORRECT: "incorrect",
        /* Incorrect Activity. */

        TEMPLATES: {
          /* Regular cosmatttsc Layout */
          cosmattcomprewidget: cosmattcomprewidgetTemplateRef
        }
      };
      // Array of all interaction tags in question
      var __interactionIds = [];
      var __processedJsonContent;
      var __feedback = {
        'correct': false,
        'incorrect': false,
        'empty': false
      };

      var __pluginInstance;
      var __isFullScreen = false;
      var checkMode = 'Submit';
      var checkMyWorkText = "Check My Work";
      var tryAgainText = "Try Again";
      var submitText = "Submit";
      var debugMode = true;

      /********************************************************/
      /*                  ENGINE-SHELL INIT FUNCTION
          
          "elRoot" :->        DOM Element reference where the engine should paint itself.                                                     
          "params" :->        Startup params passed by platform. Include the following sets of parameters:
                          (a) State (Initial launch / Resume / Gradebook mode ).
                          (b) TOC parameters (videoRoot, contentFile, keyframe, layout, etc.).
          "adaptor" :->        An adaptor interface for communication with platform (__saveResults, closeActivity, savePartialResults, getLastResults, etc.).
          "htmlLayout" :->    Activity HTML layout (as defined in the TOC LINK paramter). 
          "jsonContent" :->    Activity JSON content (as defined in the TOC LINK paramter).
          "callback" :->      To inform the shell that init is complete.
      */
      /********************************************************/
      function init(elRoot, params, adaptor, htmlLayout, jsonContentObj, callback) {

        /* ---------------------- BEGIN OF INIT ---------------------------------*/
        //Store the adaptor  
        activityAdaptor = adaptor;

        //Clone the JSON so that original is preserved.
        var jsonContent = jQuery.extend(true, {}, jsonContentObj);

        __processedJsonContent = __parseAndUpdateJSONContent(jsonContent, params, htmlLayout);


        /* ------ VALIDATION BLOCK END -------- */
        var $questionContainer = $('<div class="cosmattcomprewidget-engine"></div>');
        var $topBar = $('<nav class="topBar-cosmatengine navbar navbar-default navbar-fixed-top"><div class="question-container"></div></nav>');


        // __content.appData.options.data.hideTopToolbar = true;
        if (__content.appData.options.data.hideTopToolbar != true) {
          let $topToolbar = $('<div class="topToolbar-cosmatcomprewidget"></div>');
          $questionContainer.append($topToolbar);
          var $topFullScrnBtn = $('<button title="Expand the Exercise to Full Screen" class="btn-link fw-normal link-btn max-min-toolbar topfullscreen"><i class="fa fa-expand mr-2"></i> Full Screen</button>');
          $topToolbar.append($topFullScrnBtn);
        }


        var $questionArea = $('<div class="question-text"></div>');
        $topBar.find('.question-container').append($questionArea);

        var $questionHeading = $('<div class="question-heading"></div>');
        $questionArea.append($questionHeading);

        var $questionInstruction = $('<div class="questionInstruction"></div>');
        $questionArea.append($questionInstruction);

        var $topCloseBtn = $('<div class="topCloseBtn" title="Exit Full Screen"><i class="fa fa-times"></i></div>');
        $topBar.find('.question-container').append($topCloseBtn);

        var $pluginArea = $('<div class="pluginArea"></div>');

        $questionInstruction.html(__content.questionText);

        $questionHeading.html(__content.instructionText);

        //add callback function to appData
        __content.appData.options.data.assessmentCallback = userResponseHandler;
        __content.appData.options.data.autoResizer = autoResizeEngine;
        __pluginInstance = $pluginArea.comprehensiveWidget(activityAdaptor.getId(), __content.appData.options.data);
        $questionContainer.append($topBar);
        $questionContainer.append($pluginArea);





        // $questionContainer.append($separeator);
        $pluginArea.addClass('bottomBarVisible');

        let $bottomBar = $('<div class="bottomBar-cosmatengine"></div>');
        $questionContainer.append($bottomBar);
        let $separeator = $('<div class="separator"></div>');
        $bottomBar.append($separeator);

        let $toolbarContainer = $('<div class="toolbar-container"></div>');
        $bottomBar.append($toolbarContainer);
        //$toolbarContainer.append($('<div class="fill-space"></div>'));

        var $rightContainer = $('<div class="rightContainer" ></div>');
        var $leftContainer = $('<div class="leftContainer" ></div>');
        $toolbarContainer.append($leftContainer);
        $toolbarContainer.append($rightContainer);
        var submitButton = $('<button class="btn btn-inverse float-right ml-auto submitButton">Submit</button>');
        $rightContainer.append(submitButton);

        // var checkMyWork = $('<button class="btn btn-link fw-normal link-btn  checkMyWork"><i class="fa fa-check mr-2"></i>Check My Work</button>');
        // $leftContainer.append(checkMyWork);

        var resetButton = $('<button  title="Clears all the entries that you have added to the sheet" class="btn btn-link fw-normal link-btn resetButton"><i class="fa fa-repeat mr-2"></i>Reset</button>');
        $leftContainer.append(resetButton);

        var fullscreen = $('<button title="Expand the Exercise to Full Screen" class="btn btn-link fw-normal link-btn fullscreen max-min-toolbar" ><i class="fa fa-expand mr-2"></i> Full Screen</button>');
        $leftContainer.append(fullscreen);

        var minScreen = $('<button title="Exit Full Screen" class="btn btn-link fw-normal link-btn minScreen max-min-toolbar" style="display: none;"><i class="fa fa-compress mr-2"></i>Min Screen</button>');
        $leftContainer.append(minScreen);





        // __processedJsonContent['item-code']

        var savedResponses = window.top.assessment_compre.component.savedResponses.filter(function (response) {
          return response.id === __processedJsonContent['item-code'];
        })[0];


        if (__content.appData.options.data) {
          var data = __content.appData.options.data;
          checkMode = data.checkMode;
          if (checkMode == 'CMW') {
            $questionContainer.find('.submitButton').html(checkMyWorkText);
          }
        }

        if (savedResponses == undefined) {
          // do nothing
        } else if (savedResponses && savedResponses.data && !savedResponses.data.submitted) {
          if (checkMode == 'CMW') {
            $questionContainer.find('.submitButton').html(checkMyWorkText);
          } else {
            $questionContainer.find('.submitButton').html(submitText);
          }
          submitButton.prop("disabled", false);
          resetButton.prop("disabled", false);
        } else {
          if (checkMode == 'CMW') {
            $questionContainer.find('.submitButton').html(tryAgainText);
          } else {
            $questionContainer.find('.submitButton').html(submitText);
          }
          resetButton.prop("disabled", true);
          submitButton.prop("disabled", true);
        }


        $questionContainer.find(".resetButton").bind("click", (function () {
          try {
            __resetAnswers();
          } catch (e) {
            console.log(e);
          }
        }));


        $questionContainer.find(".submitButton").bind("click", (function () {
          // window.top.assessment_compre.component.submitTestBtnClicked();
          window.top.assessment_compre.component.checkMyWorkBtnClicked();
          if (checkMode == 'CMW') {
            if (submitButton.html() === checkMyWorkText) {
              submitButton.prop("disabled", false);
              resetButton.prop("disabled", true);
              $questionContainer.find('.submitButton').html(tryAgainText);
            } else {

              submitButton.prop("disabled", false);
              resetButton.prop("disabled", false);
              $questionContainer.find('.submitButton').html(checkMyWorkText);
            }
          } else {
            submitButton.prop("disabled", true);
            resetButton.prop("disabled", true);
          }


        }));


        if (__content.appData.options.data.hideBottomToolbar === true) {
          $bottomBar.hide();
          $pluginArea.removeClass('bottomBarVisible');
        }



        var iframeArea = $('body', window.parent.document).find(".iframeContainer").find('iframe');

        if (__content.appData.options.data.alwaysShowQuestion === true) {
          $topBar.addClass('inlineMode');
          $topBar.removeClass('navbar-default');
          $topCloseBtn.hide();
          $topBar.show();

        } else {

          $topBar.hide();   // initial UI setup
        }


        $questionContainer.find(".fullscreen, .topfullscreen").bind("click", (function () {
          __isFullScreen = true;
          //show back button
          $topCloseBtn.show();
          $pluginArea.trigger("fullScreenEvent", ["bim", "baz"]);

          //hide the footer and top navbar dom elements
          $('*', parent.document).filter(function () {
            if ($(this).css("position") === 'fixed') {
              if ($(this).hasClass('app-footer') || $(this).hasClass('navbar')
                || $(this).hasClass('sidebar-container')) {
                return this;
              }
            }
          }).hide();

          iframeArea.css({
            'width': '100vw',
            'height': '100vh',
            'z-index': '9999',
            'background-color': '#fff',
            'position': 'fixed',
            'top': 0,
            'left': 0
          });


          $bottomBar.show();
          $pluginArea.addClass('bottomBarVisible');

          if (fullscreen) {
            fullscreen.hide();
          }
          if ($topFullScrnBtn) {
            $topFullScrnBtn.hide();

          }

          $topBar.removeClass('inlineMode');
          $topBar.addClass('navbar-default');
          $topBar.show();  //display top bar
          $questionContainer.find(".minScreen").show();

          // reset  the body scroll bar on goint to min screen
          $('body', window.parent.document).css("overflow", "hidden");

          // //add to history to disable back button and override onpopstate
          // history.pushState(null, null, location.href);
          // window.onpopstate = function () {
          //   history.go(1);
          // };

          GoInFullscreen(document.documentElement);

        }));


        $questionContainer.find(".minScreen, .topCloseBtn").bind("click", (function () {
          __isFullScreen = false;

          // //remove extra history item that was pushed and reset the onpopstate funtion 
          // history.back();
          // window.onpopstate = function () {
          // };

          $topCloseBtn.hide();
          // unhide the footer and top navbar dom elements
          $('*', parent.document).filter(function () {
            if ($(this).css("position") === 'fixed') {
              if ($(this).hasClass('app-footer') || $(this).hasClass('navbar')
                || $(this).hasClass('sidebar-container')) {
                return this;
              }
            }
          }).show();

          iframeArea.css({
            'width': '100%',
            'height': '100%',
            'z-index': '',
            'background-color': '',
            'position': '',
            'top': '',
            'left': ''

          });

          $(this).hide();


          if (__content.appData.options.data.hideBottomToolbar === true) {
            $bottomBar.hide();
            $pluginArea.removeClass('bottomBarVisible');
          }

          if (__content.appData.options.data.alwaysShowQuestion === true) {
            $topBar.addClass('inlineMode');
            $topBar.removeClass('navbar-default');
            $topCloseBtn.hide();
            $topBar.show();
          } else {
            $topBar.hide();  //hide top bar
          }
          if (fullscreen) {
            fullscreen.show();
          }
          if ($topFullScrnBtn) {
            $topFullScrnBtn.show();
          }

          // reset  the body scroll bar on goint to min screen
          $('body', window.parent.document).css("overflow", "");
          $pluginArea.trigger("minScreenEvent", ["bim", "baz"]);
          GoOutFullscreen();
          //triggering widgetResized as widgetDimensionChange is not called in Firefox
          $pluginArea.trigger("widgetResized", ['']);


        }));

        //pluginArea Resize event binding
        $pluginArea.on("widgetResized", function (event, args) {
          if (debugMode) {
            debugger;
          }
          try {
            if (__isFullScreen == false && typeof activityAdaptor.autoResizeActivityIframe !== 'undefined') {
              __config.RESIZE_MODE = "auto";
              activityAdaptor.autoResizeActivityIframe();
            } else {
              __config.RESIZE_MODE = "manual";
              __config.RESIZE_HEIGHT = window.parent.innerHeight;
            }
          } catch (e) {
            console.log(e);
          }

        });

        $pluginArea.on("gridChanged", function (event, range, data, args) {
          saveCurrentState();
        });

        let GoInFullscreen = function (element) {
          try {
            if (element.requestFullscreen) {
              element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
              element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
              element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
              element.msRequestFullscreen();
            }

          } catch (e) {
            console.log(e);
          }
        }
        let GoOutFullscreen = function () {
          try {
            if (document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement) {
              if (document.exitFullscreen) {
                document.exitFullscreen ? document.exitFullscreen() : "";
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen ? document.mozCancelFullScreen() : "";
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen ? document.webkitExitFullscreen() : "";
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen ? document.msExitFullscreen() : "";
              }
            }
          } catch (e) {
            console.log(e);
          }

        }

        let fullScrToggle = false;
        $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function () {
          if (fullScrToggle) {
            $(minScreen).trigger("click");
            fullScrToggle = false;
          } else {
            fullScrToggle = true;
          }
        });

        $pluginArea.on("pluginReady", function (event, args) {
          setTimeout(function () {
            /* Inform the shell that init is complete */
            if (callback) {
              callback();
            }
          }, 300);

        });

        //add initial UI setup


        $(elRoot).html($questionContainer);

      }
      /* ---------------------- END OF INIT ---------------------------------*/

      /* ---------------------- PUBLIC FUNCTIONS --------------------------------*/
      /**
       * ENGINE-SHELL Interface
       *
       * Return configuration
       */
      function getConfig() {
        return __config;
      }
      function autoResizeEngine() {
        activityAdaptor.autoResizeActivityIframe();
      }
      function userResponseHandler(eventData) {
        // console.log("Change event ocuured for Uid : " + eventData.uid + " Range is " + eventData.range + "and value is " + eventData.data)
        saveCurrentState();

      }



      function getInteractionId(interactionField) {
        var interactions = __content.optionsJSON;
        var interactionId = '';
        for (interactionId in interactions) {
          if (interactions[interactionId].type === interactionField) {
            return interactionId;
          }
        }
        return '';
      }
      /**
       * ENGINE-SHELL Interface
       *
       * Return the current state (Activity Submitted/ Partial Save State.) of activity.
       */
      function getStatus() {
        return __state.activitySubmitted || __state.activityPariallySubmitted;
      }

      /**
       * Bound to click of Activity submit button.
       */
      function handleSubmit(event) {

        /* Check Answer */
        var s = __pluginInstance.leoRightItem.score();
        /* Marking Answers. */
        if (activityAdaptor.showAnswers) {
          __pluginInstance.leoRightItem.displayFeedback(s);
        }

        __updateAnsStatus(s);
        /* Saving Answer. */
        __saveResults(true);

        //$('input[id^=option]').attr("disabled", true);
      }

      /**
       * Function to show user grades.
       */
      function showGrades(savedAnswer, reviewAttempt) {
        try {
          if (__pluginInstance.leoRightItem !== undefined && Object.keys(__pluginInstance.leoRightItem).length !== 0) {
            var s = __pluginInstance.leoRightItem.score();
            __pluginInstance.leoRightItem.displayFeedback(s);
            __updateAnsStatus(s);

            /* Saving Answer. */
            // User state is saved in case the plugin throws a 'change' event. 
            // However, the plugin does not throw change event for all user interactions (e.g. selection update, column width update).
            // Storing user state on checkMyWork to make sure the latest plugin state is saved.
            saveCurrentState();
          }
        } catch (e) {
          console.log(e);
        }
      }

      function __updateAnsStatus(s) {
        var status = __checkAnswer(s);

        var interactionMaxScore = __content.score.max;
        var interactionMinScore = __content.score.min;
        var interactionId = "i1";
        var interaction = __content.userAnswersJSON[interactionId];

        if (interaction) {
          if (status == __constants.ACTIVITY_INCORRECT) {
            interaction.score = interactionMinScore;
            interaction.status = 'incorrect';
          } else if (status == __constants.ACTIVITY_CORRECT) {
            interaction.score = interactionMaxScore;
            interaction.status = 'correct';
          }
        }
      }
      function __checkAnswer(scoreObj) {
        var status = __constants.ACTIVITY_INCORRECT;

        if (scoreObj.scoredJson && scoreObj.scoredJson.status == "pass") {
          status = __constants.ACTIVITY_CORRECT;
        }

        return status;
      }
      /**
       * Function to display last result saved in LMS.
       */
      function updateLastSavedResults(lastResults) {
        if (lastResults.interactions && lastResults.interactions.length > 0) {
          var updatePluginVals = {};
          $.each(lastResults.interactions, function (num, value) {
            var interactionMinScore = __content.score.min;
            var optionsCount = Object.keys(__content.optionsJSON).length;
            var interactionMaxScore = __content.score.max / optionsCount;

            var interactionId = value.id;

            __content.userAnswersJSON[interactionId] = {};
            __content.userAnswersJSON[interactionId].answer = value.answer.toString();
            __content.userAnswersJSON[interactionId].correctanswer = __content.answersJSON[interactionId].correct.toString();
            __content.userAnswersJSON[interactionId].maxscore = interactionMaxScore;
            __content.userAnswersJSON[interactionId].score = interactionMinScore;
            __content.userAnswersJSON[interactionId].status = 'incorrect';

            updatePluginVals[__content.optionsJSON[value.id].type] = {
              value: value.answer
            };
            if (value.unit) updatePluginVals[__content.optionsJSON[value.id].type].unit = value.unit;
          });
          var savedState = JSON.parse(updatePluginVals.configData.value);

          savedState.leonardoId != undefined ? __pluginInstance.leoRightItem.setState(savedState) : __pluginInstance.leoRightItem.setData(savedState);

        }

      }
      /* ---------------------- PUBLIC FUNCTIONS END ----------------------------*/


      /* ---------------------- PRIVATE FUNCTIONS -------------------------------*/

      /* ---------------------- JSON PROCESSING FUNCTIONS START ---------------------------------*/
      /**
       * Parse and Update JSON based on cosmatttsc specific requirements.
       */
      function __parseAndUpdateJSONContent(jsonContent, params, htmlLayout) {

        jsonContent.content.displaySubmit = activityAdaptor.displaySubmit;

        __content.activityType = params.engineType;
        __content.layoutType = jsonContent.content.canvas.layout;

        /* Activity Instructions. */
        var tagName = jsonContent.content.instructions[0].tag;
        __content.instructionText = jsonContent.content.instructions[0][tagName];
        __content.appData = jsonContent["app-data"];
        __content.score = jsonContent.meta.score;

        var questionText = jsonContent.content.canvas.data.questiondata[0].text;

        var interactionId = [];
        var interactionTag = [];
        /* String present in href of interaction tag. */
        var interactionReferenceString = "http://www.comprodls.com/m1.0/interaction/cosmattcomprewidget";
        /* Parse questiontext as HTML to get HTML tags. */
        var parsedQuestionArray = $.parseHTML(jsonContent.content.canvas.data.questiondata[0].text);
        var j = 0;
        $.each(parsedQuestionArray, function (i, el) {
          if (this.href === interactionReferenceString) {
            interactionId[j] = this.childNodes[0].nodeValue.trim();
            __interactionIds.push(interactionId[j]);
            interactionTag[j] = this.outerHTML.replace(/"/g, "'");
            j++;
          }
        });

        $.each(interactionId, function (i) {
          var interactionId = this;
          //var id = __config.ENTRY_BOX_PREFIX +  __content.answersXML.length;
          /*
           * Add entry box.
           */
          questionText = questionText.replace(interactionTag[i], "");
          __content.answersJSON[interactionId] = jsonContent.responses[interactionId];
          __content.optionsJSON[interactionId] = jsonContent.content.interactions[interactionId];
        });

        __content.questionText = questionText;

        /* Returning processed JSON. */
        return jsonContent;
      }


      /**
   * Function called to send result JSON to adaptor (partial save OR submit).
   * Parameters:
   * 1. bSumbit (Boolean): true: for Submit, false: for Partial Save.
   */
      function __saveResults(bSubmit) {

        var uniqueId = activityAdaptor.getId();

        /*Getting answer in JSON format*/
        var answerJSON = __getAnswersJSON(false);

        if (bSubmit === true) { /*Hard Submit*/

          /*Send Results to platform*/
          activityAdaptor.submitResults(answerJSON, uniqueId, function (data, status) {
            if (status === __constants.STATUS_NOERROR) {
              __state.activitySubmitted = true;
              /*Close platform's session*/
              activityAdaptor.closeActivity();
              __state.currentTries = 0;
            } else {
              /* There was an error during platform communication, so try again (till MAX_RETRIES) */
              if (__state.currentTries < __config.MAX_RETRIES) {
                __state.currentTries++;
                __saveResults(bSubmit);
              }

            }

          });
        } else { /*Soft Submit*/
          /*Send Results to platform*/
          activityAdaptor.savePartialResults(answerJSON, uniqueId, function (data, status) {
            if (status === __constants.STATUS_NOERROR) {
              __state.activityPariallySubmitted = true;
            } else {
              /* There was an error during platform communication, do nothing for partial saves */
            }
          });
        }
      }

      /*------------------------OTHER PRIVATE FUNCTIONS------------------------*/

      /**
       * Function to show correct Answers to User, called on click of Show Answers Button.
       */
      function __markAnswers() {
        var markAnswerObj = {};
        var userAnswers = __content.userAnswersJSON;
        var options = __content.optionsJSON;
        var interactions = Object.keys(__content.optionsJSON);
        var answers = __content.answersJSON;

        interactions.forEach(function (element, index) {
          if (userAnswers[element] && userAnswers[element].status) {
            if (userAnswers[element].status == "correct") {
              markAnswerObj[options[element].type] = { status: true };
            } else {
              markAnswerObj[options[element].type] = { status: false };
            }
          } else {
            markAnswerObj[options[element].type] = { status: false };
          }
          markAnswerObj[options[element].type].correctAnswer = answers[element].correct;

        });
        __pluginInstance.leoRightItem.markAnswers(markAnswerObj);


      }


      function __generateFeedback() {
        for (var prop in __feedback) {
          __feedback[prop] = false;
        }
        if (!__content.userAnswersJSON[0]) {
          __feedback.empty = true;
        } else if (__content.answersJSON[0] === __content.userAnswersJSON[0]) {
          __feedback.correct = true;
        } else {
          __feedback.incorrect = true;
        }
      }

      function __resetAnswers() {
        __pluginInstance.leoRightItem.reset();
        saveCurrentState();
      }

      function __clearGrades() {
        __pluginInstance.leoRightItem.clearFeedback();
        saveCurrentState();
      }

      function __destroy() {
        __pluginInstance.leoRightItem.destroy();
        if (__pluginInstance.leoLeftItem) {
          __pluginInstance.leoLeftItem.destroy();
        }
        __pluginInstance.leoRightItem.destroy();
        __pluginInstance.destroy();
        //reset global listners
        $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function () { });
      }

      function saveCurrentState() {

        var currState = { configData: { value: JSON.stringify(__pluginInstance.leoRightItem.getState()), unit: "" } };
        for (var property in currState) {
          if (currState.hasOwnProperty(property) && currState[property].value !== undefined) {
            var interactionMinScore = __content.score.min;
            var optionsCount = Object.keys(__content.optionsJSON).length;
            var interactionMaxScore = __content.score.max / optionsCount;

            var interactionId = getInteractionId(property);
            var status = __content.userAnswersJSON[interactionId] && __content.userAnswersJSON[interactionId].status ? __content.userAnswersJSON[interactionId].status : "incorrect";
            if (interactionId != "") {
              __content.userAnswersJSON[interactionId] = {};
              __content.userAnswersJSON[interactionId].answer = currState[property].value.toString();
              if (currState[property].unit != undefined) __content.userAnswersJSON[interactionId].unit = currState[property].unit.toString();
              __content.userAnswersJSON[interactionId].maxscore = interactionMaxScore;
              __content.userAnswersJSON[interactionId].score = interactionMinScore;
              __content.userAnswersJSON[interactionId].status = status;

            }
          }
        }
        __saveResults(false);
      }

      /**
       *  Function used to create JSON from user Answers for submit(soft/hard).
       *  Called by :-
       *   1. __saveResults (internal).
       *   2. Multi-item-handler (external).
       */
      function __getAnswersJSON(skipQuestion) {
        var answers = "";
        /*Setup results array */
        var interactionArray = [];
        /* Split questionJSON to get interactionId. */

        var statusProgress = __constants.ACTIVITY_NOT_ATTEMPTED;
        var statusEvaluation = __constants.ACTIVITY_INCORRECT;
        var partiallyCorrect = false;
        var correct = false;

        if (skipQuestion) {
          answers = "Not Answered";
        } else {
          answers = __content.userAnswersJSON;
          /* Calculating scores.*/
          for (var answerID in answers) {
            var interaction = {};
            interaction.id = answerID;
            interaction.answer = answers[answerID].answer;
            interaction.maxscore = answers[answerID].maxscore;
            interaction.score = answers[answerID].score;
            interaction.unit = answers[answerID].unit;
            interactionArray.push(interaction);
          }
        }

        var interactions = Object.keys(__content.optionsJSON);
        partiallyCorrect = interactions.some(function (element, index) {
          if (answers[element] && answers[element].status == "correct") {
            return true;
          }
        });

        correct = interactions.every(function (element, index) {
          if (answers[element] && answers[element].status == "correct") {
            return true;
          }
        });

        if (partiallyCorrect) {
          statusEvaluation = __constants.ACTIVITY_PARTIALLY_CORRECT;
        }

        if (correct) {
          statusEvaluation = __constants.ACTIVITY_CORRECT;
        }

        var response = {
          "interactions": interactionArray
        };

        if (!skipQuestion) {
          statusProgress = __constants.ACTIVITY_IN_PROGRESS;
        }

        response.statusProgress = statusProgress;
        response.statusEvaluation = statusEvaluation;

        return {
          response: response
        };
      }

      return {
        /*Engine-Shell Interface*/
        "init": init,
        /* Shell requests the engine intialized and render itself. */
        "getStatus": getStatus,
        /* Shell requests a gradebook status from engine, based on its current state. */
        "getConfig": getConfig,
        /* Shell requests a engines config settings.  */
        "handleSubmit": handleSubmit,
        "showGrades": showGrades,
        "resetAnswers": __resetAnswers,
        "updateLastSavedResults": updateLastSavedResults,
        "clearGrades": __clearGrades,
        "destroy": __destroy
      };
    };
  });