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
   'css!../libs/libs-frontend-PLGraph/dist/css/plGraph.min.css',
   'css!../css/cosmattcomprewidget.css', //Custom styles of the engine (applied over bootstrap & front-end-core)
   
    '../libs/libs-frontend-PLGraph/dist/js/plGraph.js'
  ], //Required by Rivets
  function(cosmattcomprewidgetTemplateRef) {


    cosmattcomprewidget = function() {

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
        var $questionContainer = $('<div class="row cosmattcomprewidget-engine"></div>');
        var $questionArea = $('<p class="col-sm-12 text-primary question-text"></p>');
        var $pluginArea = $('<div class="col-sm-12"></div>');

        $questionArea.html(__content.questionText);

        //add callback function to appData
        __content.appData.options.data.assessmentCallback = userResponseHandler;
        __content.appData.options.data.autoResizer = autoResizeEngine;
        __pluginInstance = $pluginArea.ProfitLossCurve(__content.appData.options.data);

        $questionContainer.append($questionArea);
        $questionContainer.append($pluginArea);

        $(elRoot).html($questionContainer);

        /* ---------------------- SETUP EVENTHANDLER STARTS----------------------------*/

        // $('input[id^=option]').change(__handleRadioButtonClick);

        // $(document).bind('userAnswered', function(e, value) {
        //   __saveResults(false);
        // });

        /* ---------------------- SETUP EVENTHANDLER ENDS------------------------------*/

        /* Inform the shell that init is complete */
        if (callback) {
          callback();
        }

        /* ---------------------- END OF INIT ---------------------------------*/
      } /* init() Ends. */
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
      function userResponseHandler(callbackValue) {
        for (var property in callbackValue) {
          if (callbackValue.hasOwnProperty(property) && callbackValue[property].value  !== undefined) {
            var interactionMinScore = __content.score.min;
            var optionsCount = Object.keys(__content.optionsJSON).length;
            var interactionMaxScore = __content.score.max / optionsCount;

            var interactionId = getInteractionId(property);
            if (interactionId != '') {
              __content.userAnswersJSON[interactionId] = {};
              __content.userAnswersJSON[interactionId].answer = callbackValue[property].value.toString();
              if (callbackValue[property].unit != undefined) __content.userAnswersJSON[interactionId].unit = callbackValue[property].unit.toString();
              __content.userAnswersJSON[interactionId].correctanswer = __content.answersJSON[interactionId].correct.toString();
              __content.userAnswersJSON[interactionId].maxscore = interactionMaxScore;


              if (Math.round(parseFloat(callbackValue[property].value) * 1000) / 1000 == parseFloat(__content.answersJSON[interactionId].correct)) {
                __content.userAnswersJSON[interactionId].score = interactionMaxScore;
                __content.userAnswersJSON[interactionId].status = 'correct';
              } else {
                __content.userAnswersJSON[interactionId].score = interactionMinScore;
                __content.userAnswersJSON[interactionId].status = 'incorrect';
              }
            }
          }
        }
        // $(document).triggerHandler('userAnswered', callbackValue);
        __saveResults(false);
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
        /* Saving Answer. */
        __saveResults(true);

        /* Marking Answers. */
        if (activityAdaptor.showAnswers) {
          __markAnswers();
        }

        //$('input[id^=option]').attr("disabled", true);
      }

      /**
       * Function to show user grades.
       */
      function showGrades(savedAnswer, reviewAttempt) {
        /* Show last saved answers. */
        // updateLastSavedResults(savedAnswer);
        /* Mark answers. */
        __markAnswers();
        //$('input[id^=option]').attr("disabled", true);
      }

      /**
       * Function to display last result saved in LMS.
       */
      function updateLastSavedResults(lastResults) {
        var updatePluginVals = {};
        $.each(lastResults.interactions, function(num, value) {
          var interactionMinScore = __content.score.min;
          var optionsCount = Object.keys(__content.optionsJSON).length;
          var interactionMaxScore = __content.score.max / optionsCount;

          var interactionId = value.id;

          __content.userAnswersJSON[interactionId] = {};
          __content.userAnswersJSON[interactionId].answer = value.answer.toString();
          __content.userAnswersJSON[interactionId].correctanswer = __content.answersJSON[interactionId].correct.toString();
          __content.userAnswersJSON[interactionId].maxscore = interactionMaxScore;

          if (Math.round(parseFloat(value.answer) * 100) / 100 == parseFloat(__content.answersJSON[interactionId].correct)) {
            __content.userAnswersJSON[interactionId].score = interactionMaxScore;
            __content.userAnswersJSON[interactionId].status = 'correct';
          } else {
            __content.userAnswersJSON[interactionId].score = interactionMinScore;
            __content.userAnswersJSON[interactionId].status = 'incorrect';
          }
          updatePluginVals[__content.optionsJSON[value.id].type] = {
            value: value.answer
          };
          if (value.unit) updatePluginVals[__content.optionsJSON[value.id].type].unit = value.unit;
        });
        __pluginInstance.updateInputs(updatePluginVals);

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
        /* Put directions in JSON. */
        //jsonContent.content.directions = __content.directionsJSON;
        // $.each(jsonContent.content.stimulus, function (i) {
        //     if (this.tag === "image") {
        //         jsonContent.content.stimulus.mediaContent = params.questionMediaBasePath + this.image;
        //     }
        // });
        var questionText = jsonContent.content.canvas.data.questiondata[0].text;

        var interactionId = [];
        var interactionTag = [];
        /* String present in href of interaction tag. */
        var interactionReferenceString = "http://www.comprodls.com/m1.0/interaction/cosmattcomprewidget";
        /* Parse questiontext as HTML to get HTML tags. */
        var parsedQuestionArray = $.parseHTML(jsonContent.content.canvas.data.questiondata[0].text);
        var j = 0;
        $.each(parsedQuestionArray, function(i, el) {
          if (this.href === interactionReferenceString) {
            interactionId[j] = this.childNodes[0].nodeValue.trim();
            __interactionIds.push(interactionId[j]);
            interactionTag[j] = this.outerHTML.replace(/"/g, "'");
            j++;
          }
        });

        $.each(interactionId, function(i) {
          var interactionId = this;
          //var id = __config.ENTRY_BOX_PREFIX +  __content.answersXML.length;
          /*
           * Add entry box.
           */
          questionText = questionText.replace(interactionTag[i], "");
          __content.answersJSON[interactionId] = jsonContent.responses[interactionId];
          __content.optionsJSON[interactionId] = jsonContent.content.interactions[interactionId];
        });
        /* Replace interaction tag with blank string. */
        // jsonContent.content.canvas.data.questiondata[0].text = jsonContent.content.canvas.data.questiondata[0].text.replace(interactionTag, "");
        // var questionText = "1.  " + jsonContent.content.canvas.data.questiondata[0].text;
        // var correctAnswerNumber = jsonContent.responses[interactionId].correct;
        // var interactionType = jsonContent.content.interactions[interactionId].type;
        // var optionCount = jsonContent.content.interactions[interactionId][interactionType].length;

        // /* Make optionsJSON and answerJSON from JSON. */
        // for (var i = 0; i < optionCount; i++) {
        //     var optionObject = jsonContent.content.interactions[interactionId][interactionType][i];
        //     var option = optionObject[Object.keys(optionObject)].replace(/^\s+|\s+$/g, '');
        //     __content.optionsJSON.push(__getHTMLEscapeValue(option));
        //     optionObject[Object.keys(optionObject)] = option;
        //     /* Update JSON after updating option. */
        //     jsonContent.content.interactions[interactionId][interactionType][i] = optionObject;
        //     if (Object.keys(optionObject) == correctAnswerNumber) {
        //         __content.answersJSON[0] = optionObject[Object.keys(optionObject)];
        //     }
        // }
        __content.questionText = questionText;

        /* Returning processed JSON. */
        return jsonContent;
      }


      /**
       * Parse and Update Question Set type JSON based on  cosmatttsc specific requirements.
       */
      // function __parseAndUpdateQuestionSetTypeJSON(jsonContent) {

      //     /* Extract interaction id's and tags from question text. */
      //     var interactionId = "";
      //     var interactionTag = "";
      //     /* String present in href of interaction tag. */
      //     var interactionReferenceString = "http://www.comprodls.com/m1.0/interaction/cosmatttsc";
      //     /* Parse questiontext as HTML to get HTML tags. */
      //     var parsedQuestionArray = $.parseHTML(jsonContent.content.canvas.data.questiondata[0].text);
      //     $.each(parsedQuestionArray, function (i, el) {
      //         if (this.href === interactionReferenceString) {
      //             interactionId = this.childNodes[0].nodeValue.trim();
      //             __interactionIds.push(interactionId);
      //             interactionTag = this.outerHTML;
      //             interactionTag = interactionTag.replace(/"/g, "'");
      //         }
      //     });
      //     /* Replace interaction tag with blank string. */
      //     jsonContent.content.canvas.data.questiondata[0].text = jsonContent.content.canvas.data.questiondata[0].text.replace(interactionTag, "");
      //     var questionText = "1.  " + jsonContent.content.canvas.data.questiondata[0].text;
      //     var correctAnswerNumber = jsonContent.responses[interactionId].correct;
      //     var interactionType = jsonContent.content.interactions[interactionId].type;
      //     var optionCount = jsonContent.content.interactions[interactionId][interactionType].length;

      //     /* Make optionsJSON and answerJSON from JSON. */
      //     for (var i = 0; i < optionCount; i++) {
      //         var optionObject = jsonContent.content.interactions[interactionId][interactionType][i];
      //         var option = optionObject[Object.keys(optionObject)].replace(/^\s+|\s+$/g, '');
      //         __content.optionsJSON.push(__getHTMLEscapeValue(option));
      //         optionObject[Object.keys(optionObject)] = option;
      //         /* Update JSON after updating option. */
      //         jsonContent.content.interactions[interactionId][interactionType][i] = optionObject;
      //         if (Object.keys(optionObject) == correctAnswerNumber) {
      //             __content.answersJSON[0] = optionObject[Object.keys(optionObject)];
      //         }
      //     }
      //     __content.questionsJSON[0] = questionText + " ^^ " + __content.optionsJSON.toString() + " ^^ " + interactionId;
      // }

      /**
       * Escaping HTML codes from String.
       */
      // function __getHTMLEscapeValue(content) {
      //     var tempDiv = $("<div></div>");
      //     $(tempDiv).html(content);
      //     $("body").append(tempDiv);
      //     content = $(tempDiv).html();
      //     $(tempDiv).remove();
      //     return content;
      // }

      /***
             * Function to modify question JSON for easy iteration in template
             * 
             * Original JSON Object
             * ---------------------
             * 
             * "cosmatttsc": [
                  {
                    "choiceA": "She has the flu." 
                  },
                  {
                    "choiceB": "She has the measles."
                  }  
                ]
        
                Modified JSON Object
                ----------------------
        
                "cosmatttsc": [
                  {
                      "customAttribs" : {
                            "key" : "choiceA",
                            "value" : "She has the flu.",
                            "isEdited" : false,
                            "index" : 0
                            "isCorrect" : false
                      } 
                  },
                   {
                      "customAttribs" : {
                            "key" : "choiceB",
                            "value" : "She has the measles.",
                            "isEdited" : false,
                            "index" : 1
                            "isCorrect" : true
                      } 
                  }  
                ]
             */
      // function __parseAndUpdateJSONForRivets(jsonContent) {
      //     var processedArray = [];
      //     for (var i = 0; i < __interactionIds.length; i++) {
      //         jsonContent.content.interactions[__interactionIds[i]].cosmatttsc.forEach(function (obj, index) {
      //             var processedObj = {};
      //             processedObj.customAttribs = {};
      //             Object.keys(obj).forEach(function (key) {
      //                 processedObj.customAttribs.key = key;
      //                 processedObj.customAttribs.value = obj[key];
      //             });
      //             processedArray.push(processedObj);
      //         });
      //         jsonContent.content.interactions[__interactionIds[i]].cosmatttsc = processedArray;
      //     }
      // }

      /*------------------------RIVET INITIALIZATION & BINDINGS -------------------------------*/
      // function __initRivets() {
      //     /* Formatter to transform object into object having 'key' property with value key
      //      * and 'value' with the value of the object
      //      * Example:
      //      * var obj = {'choiceA' : 'She has flu.'} to
      //      * obj= { 'key' : 'choiceA', 'value' : 'She has flu.'}
      //      * This is done to access the key and value of object in the template using rivets.
      //      */
      //     rivets.formatters.propertyList = function (obj) {
      //         return (function () {
      //             var properties = [];
      //             for (var key in obj) {
      //                 properties.push({ key: key, value: obj[key] })
      //             }
      //             return properties
      //         })();
      //     }

      //     /* This formatter is used to append interaction property to the object
      //      * and return text of the question for particular interaction
      //      */
      //     rivets.formatters.appendInteraction = function (obj, interaction, cosmatttsc) {
      //         return obj[interaction].text;
      //     }

      //     /* This formatter is used to return the array of options for a particular
      //      * interaction so that rivets can iterate over it.
      //      */
      //     rivets.formatters.getArray = function (obj, interaction) {
      //         return obj[interaction].cosmatttsc;
      //     }

      //     var isMCQImageEngine = false;
      //     /* Find if layout is of type MCQ_IMG*/
      //     if (__content.layoutType == 'MCQ_IMG') {
      //         isMCQImageEngine = true;
      //     }

      //     /*Bind the data to template using rivets*/
      //     rivets.bind($('#cosmatttsc-engine'), {
      //         content: __processedJsonContent.content,
      //         isMCQImageEngine: isMCQImageEngine,
      //         feedback: __processedJsonContent.feedback,
      //         showFeedback: __feedback
      //     });
      // }

      /*------------------------RIVETS END-------------------------------*/

      /* ---------------------- JQUERY BINDINGS ---------------------------------*/
      /**
       * Function to handle radio button click.
       */
      // function __handleRadioButtonClick(event) {
      //     /*
      //      * Soft save here
      //      */
      //     var currentTarget = event.currentTarget;

      //     $("label.radio").parent().removeClass("highlight");
      //     $(currentTarget).parent().parent("li").addClass("highlight");

      //     var newAnswer = currentTarget.value.replace(/^\s+|\s+$/g, '');

      //     /* Save new Answer in memory. */
      //     __content.userAnswersJSON[0] = newAnswer.replace(/^\s+|\s+$/g, '');

      //     __state.radioButtonClicked = true;

      //     var interactionId = __content.questionsJSON[0].split("^^")[2].trim();

      //     $(document).triggerHandler('userAnswered');
      // }

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
          activityAdaptor.submitResults(answerJSON, uniqueId, function(data, status) {
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
          activityAdaptor.savePartialResults(answerJSON, uniqueId, function(data, status) {
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

        interactions.forEach(function(element, index) {
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
        __pluginInstance.markAnswers(markAnswerObj);



        // var radioNo = "";
        // /* Looping through answers to show correct answer. */
        // for (var i = 0; i < __content.optionsJSON.length; i++) {
        //     radioNo = "" + i;
        //     __markRadio(radioNo, __content.answersJSON[0], __content.optionsJSON[i]);
        // }
        // __generateFeedback();
      }
      /* Add correct or wrong answer classes*/
      // function __markRadio(optionNo, correctAnswer, userAnswer) {
      //     if (userAnswer.trim() === correctAnswer.trim()) {
      //         $($(".answer")[optionNo]).removeClass("wrong");
      //         $($(".answer")[optionNo]).addClass("correct");
      //         $($(".answer")[optionNo]).parent().addClass("state-success");
      //     } else {
      //         $($(".answer")[optionNo]).removeClass("correct");
      //         $($(".answer")[optionNo]).addClass("wrong");
      //         $($(".answer")[optionNo]).parent().addClass("state-error");
      //     }
      //     $(".answer" + optionNo).removeClass("invisible");
      // }

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
        partiallyCorrect = interactions.some(function(element, index) {
          if (answers[element] && answers[element].status == "correct") {
            return true;
          }
        });

        correct = interactions.every(function(element, index) {
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
        "updateLastSavedResults": updateLastSavedResults
      };
    };
  });