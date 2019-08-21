# Assessment Item Type | Reference Implementation
This repository represents a reference implementation (best practices, seed project, etc.) for implementing new comproDLS assessment item types (for example - Multiple Choice, Single Select). Also known as **engines**, comproDLS&trade; Assessment types are designed to automatically plug-n-play with the following components in the comproDLS&trade; ecosystem:
* **comproDLS&trade; Assessments** (showcase & development bench for assessments)
* **comproDLS&trade; Builder** (authoring courses & product models, with assessments)
* **comproDLS&trade; Test Runner** (embedding assessments in Experience Apps)
* **comproDLS&trade; Activity API** (attempts & state management)
* **comproDLS&trade; Analytics API** (learning & content analytics)

Following sections provide more details on how to setup your own assessment (item type) project and related development, release & integration practices.

### Related documents & references
1. [comproDLS&trade; Product Schema](https://docs.google.com/a/comprotechnologies.com/document/d/1npkT-s7aIWrAi_uXMldWMuX9UWpvhHXTflvi__Pm2jo/edit?usp=sharing) - Read this before defining the underlying schema (instructions, options, interactions, assets/stimulus etc.). While every assessment type will have its own unique schema aspects, some elements are standardized (metadata, question text, scores, feedback, etc.) as per the comproDLS&trade; product schema document.
2. [comproDLS&trade; Assessment Showcase & Development bench](http://assessment.comprodls.com) - Use this portal to review existing assessment types, examples, as well as to develop new assessment types (provide tools for testing and customization).
3. [comproDLS&trade; Test Runner](https://github.com/comprodls/libs-frontend-testrunner) - Use this front-end library to embed assessment types (mix of custom and standard) in your application. This document is more relevant for higher-level use cases (Experience Apps, Integrations).
3. [comproDLS&trade; Activity API](http://activity.comprodls.com) - Used for managing runtime state and attempt history. See https://github.com/comprodls/service-activity/wiki/01_Activity_Concepts for more details. This document is more relevant for higher-level use cases (Experience Apps, Integrations).
4. [comproDLS&trade; Analytics API](http://analytics.comprodls.com)- Once your application is integrated with the ACTIVITY API, learning analytics for user progress & time spent are automatically available via the ANALYTICS API. This document is more relevant for higher-level use cases (Experience Apps, Integrations).


## 1. Getting started - Setup a starter project
1. Choose a unique **comproDLS&trade; code** for your Assessment type (MCSR, FIB, DND, etc). Refer to **TODO** for existing codes which can't be used.
2. Setup a new GitHub repository using the following standard naming convention - **libs-engine-CODE** (all lowercase)
3. Copy the contents of this repository into the new repository as the initial commit. Your repository folder structure should look like: 
``` 
src
     js
        <CODE>.js
        <CODE>-editor.js
     css
        <CODE>.css
        <CODE>-editor.css
     html
        <CODE>.html
        <CODE>-editor.html
     json
        <CODE>.json
     assets
 dist     
     <CODE>.js
     <CODE>-editor.js
     assets    
Gruntfile.js
package.json
bower.json
Readme.md
.gitignore
```
4. Rename all the files (as shown above) containing `<CODE>` appropriately. For example if your `CODE` is `QUESTION_TYPE_X` then files under the `js` folder would be renamed to `QUESTION_TYPE_X.js` and `QUESTION_TYPE_X-editor.js`
5. Open the files listed below and replace all references of `MCQSR` (all uppercase) with your unique code i.e. `QUESTION_TYPE_X`(all uppercase) and all references of `mcqsr`(all lowercase) with your unique code i.e. `question_type_x`(all lowercase)
```
src
     js
        <CODE>.js
        <CODE>-editor.js
     css
        <CODE>.css
        <CODE>-editor.css
     html
        <CODE>.html
        <CODE>-editor.html
     json
        <CODE>.json
Gruntfile.js        
```
6. Run the following commands to initialize your project and compile the changed files.
```
npm install
grunt
```
If everything worked fine, you should see an output as follows:

```
Running "requirejs:engine" (requirejs) task
Completed requirejs optimization for mcqsr renderer successfully.

Running "requirejs:engineEditor" (requirejs) task
Completed requirejs optimization for mcqsr editor successfully.

Running "copy:images" (copy) task
Copied 1 file
Done.
```

## 2. Testing your Assessment Type 
1. Commit and push the above changes to your REMOTE GitHub. Also ensure that your GitHub repository is public (not private) **TODO - solve this**
2. Open http://assessment.comprodls.com and login using your comproDLS&trade; development account.
3. Click on "Register New Item" in the left menu bar.
4. Fill in the register form using your newly created item credentials.
	* **Path** - External item repository full folder path.
	* **Item Type** - Your engine CODE.
	* **Item Name** - Name you want to give to the item.
	* **Layout** - Enter your Engine CODE here. This is the name of default layout/variation to be used for the item.
	* **Supports Editor** - Mark NO (in future set to YES, depending on whether your new item supports editor interface or not)
	* **Sample Content** - Copy & Paste contents of your default/sample **question JSON** - `json/<CODE>.json`
11. Click on **Register**, you will be directly taken to a fresh page, where your newly created assessment type will be functioning.


## 3. Development process / worklflow
If you're developing your first assessment type, its strongly recommended that your break down your workflow into **two** phases:
### 3.1 - Building Student/Instructor Experience
* Define a basic UX MOCK/Wireframe - this is help with the subsequent steps for designing your schema and layout.
* Identify your specific schema elements/aspects (which are not already available in comproDLS&trade; Product schema or cannot be mapped to an existing schema construct).
* Define the default/sample **question JSON** - `json/<CODE>.json`. You could use following sample schema as a starting point.
```json
{
    "meta": { 
        "type": "MCQSR",
        "title": "Island Survival Test 1",
        "score": {
            "default": 0,
            "max": 1,
            "min": 0
        }
    },
    "content": {
        "instructions": [{
            "tag": "html",
            "html": "Please read the question carefully, and select ONE option as your answer."
        }],
        "canvas": {
            "layout": "MCQSR",
            "data": {
                "questiondata": [{
                    "text": "You are alone in a deserted island and about to die. God appears and gives one wish with pre-defined options. Choose the correct answer?"
                }]
            }
        }
    },
    "interactions": {},
    "feedback": {
        "global": {
            "correct": "Well done. You will live.",
            "incorrect": "Sorry, wrong choice, your are about to die.",
            "empty": "Please do attempt the question. Its you're only chance."
        }
    },
    "responses": {},
    "learning-objectives": [],
    "tags": []
}
```
For more information on the standard comproDLS&trade; schema elements and their purpose, see https://docs.google.com/document/d/1npkT-s7aIWrAi_uXMldWMuX9UWpvhHXTflvi__Pm2jo/edit#heading=h.lz5q7wlcy4c1


* Based on your UX, define the default layout for your assessment type - `html/<CODE>.html`. Include basic or first-level templating snippets (see http://rivetsjs.com/docs/guide/#usage for details on the RIVETS templating engine) for linking your **question JSON** to your template. Start with the standard schema elements like `content.instructions`, `meta.title` etc. You could use following vanilla template as a starting point.
```html
<div class="well" id="mcqsr-engine">  <!-- the "id" attribute must set as shown. -->
   <!-- Displaying the Title -->
   <h1 rv-text="jsonContent.meta.title"></h1>
   <!-- Displaying Instructions -->
   <div rv-each-instruction="jsonContent.content.instructions">
      <p class="lead" rv-text="instruction.html"></p>
   </div>   
   <!-- Displaying the question -->
   <div rv-each-question="jsonContent.content.canvas.data.questiondata">
      <h6 rv-text="question.text"></h6>
   </div>   
   <!-- TODO - Display options -->
</div>
```
* If necessary add **custom styles** to align with your default template in `css/<CODE>.css`. Note **[Bootstrap 3.3.7]**(https://github.com/twbs/bootstrap) is already included as the baseline styling system. You may skip this step initially and simply leverage default bootstrap styles.
* Now you are ready to start writing your **javascript module** in the files `js/<CODE>.js`. The library  **`jquery 3.2.1`** is available as the baseline. Use the standard AMD module (see http://requirejs.org/docs/whyamd.html#amd ) pattern for specifying additional dependencies. Following is the vanilla starter module which uses RIVETS (for two-way binding and templating).

```javascript
/*
 * -------------
 * Engine Module
 * -------------
 * 
 * Item Type: MCQSR Single Choice Quesion engine
 * Code: MCQSR
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
 * 2. Boostrap (3.3.7) 
 */
define(['text!../html/mcqsr.html', //layout(s) template representing the UX
        'rivets',  // Rivets for data binding
        'sightglass'], //Required by Rivets
        function (mcqsrTemplateRef) {

    mcqsr = function() {
    
    "use strict";
        
    /*
     * Reference to platform's activity adaptor (passed during init() ).
     */
    var activityAdaptor;     
    
    /*
     * Internal Engine Config.
     */ 
    var __config = {
        MAX_RETRIES: 10, /* Maximum number of retries for sending results to platform for a particular activity. */ 
        RESIZE_MODE: "auto", /* Possible values - "manual"/"auto". Default value is "auto". */
        RESIZE_HEIGHT: "580" /* Applicable, if RESIZE_MODE is manual. If RESIZE_HEIGHT is defined in TOC then that will overrides. */
        /* If both config RESIZE_HEIGHT and TOC RESIZE_HEIGHT are not defined then RESIZE_MODE is set to "auto"*/
    };
    
    /*
     * Internal Engine State - used to manage/track current status of the assessment.
     */ 
    var __state = {
        activityPariallySubmitted: false, /* State whether activity has been partially submitted. Possible Values: true/false(Boolean) */
        activitySubmitted: false /* State whether activity has been submitted. Possible Values: true/false(Boolean) */
    };  

    /*
     * Constants.
     */
    var __constants = {
        TEMPLATES: {
            /* Regular MCQSR Layout */
            MCQSR: mcqsrTemplateRef
        }
    };
        
    /********************************************************/
    /*                  INIT FUNCTION
        
        "elRoot" :->        DOM Element reference where the engine should paint itself.                                                     
        "params" :->        Startup params passed by platform. 
        "adaptor" :->        An adaptor interface for communication with platform. 
        "htmlLayout" :->     HTML layout  
        "jsonContent" :->    Question JSON 
        "callback" :->      Function to inform platform that init is complete.
    */
    /********************************************************/  
    function init(elRoot, params, adaptor, htmlLayout, questionJSON, callback) {        
        //Store the adaptor  
        activityAdaptor = adaptor;

        //Clone question JSON so that original is preserved.
        var jsonContent = jQuery.extend(true, {}, questionJSON);
        
        /* Apply the layout HTML to the dom */
        $(elRoot).html(__constants.TEMPLATES[htmlLayout]);

        /* Process the template by initializing RIVETs */
         rivets.bind($('#mcqsr-engine'), {
            jsonContent: jsonContent
        });
        
        /* Inform the Platform that init is complete */
        if(callback) {
            callback();
        }                               
    } /* init() Ends. */        
    
    /* ---------------------- PUBLIC FUNCTIONS --------------------------------*/
    /**
     * ENGINE Interface
     *
     * Returns configuration (width, height, etc) of the assessment
     */
    function getConfig () {
        return __config;
    }
    
    /**
     * ENGINE Interface
     *
     * Returns the current state (Activity Submitted/ Partial Save State.) of assessment.
     */
    function getStatus() {
        return __state.activitySubmitted || __state.activityPariallySubmitted;
    }


    return {
        /*Engine Interface*/
        "init": init, /* Shell requests the engine intialized and render itself. */
        "getStatus": getStatus, /* Shell requests a gradebook status from engine, based on its current state. */
        "getConfig" : getConfig, /* Shell requests a engines config settings.  */
        "handleSubmit" : function() {/* Do Nothing for now. Sample only*/},
        "showGrades": function() {/* Do Nothing for now. Sample only*/},
        "updateLastSavedResults": function() {/* Do Nothing for now. Sample only*/}
    };
    };
});
```
* Commit your code and test using http://assessment.comprodls.com. NOTE, at the time of registration, Specify SUPPORT EDITOR as **Sfalse**


### 3.2 - Authoring Experience
TODO

## 4. Understanding the ENGINE interface
The AMD **javascript module** conform to a standard **ENGINE interface** which ensures that your assesment type can be embedded and integrated across various comproDLS apps and components
* comproDLS&trade; Assessments (assessment.comprodls.com)
* comproDLS&trade; Builder 
* comproDLS&trade; Test Runner (widget for embedding assessments in Experience Apps)
* comproDLS&trade; Activity API (attempts & state management)
* comproDLS&trade; Analytics API (learning & content analytics)

### 4.1 Public Methods 
These methods must be defined, as they will invoked by the platform.

#### 4.1.1 init()
First function (main) called by the platform. The responsiblity of the engine to fully initialize and render itself (including bind necessary DOM) - such  that its fully ready to accept inputs (answers) from the student, and provide feedback (as necessary). It makes the adaptor and questionJsonContent available to the engine which are passed as parameters. The DOM event handlers are setup inside init() which handle user interactions. The engine must explicitly **notify** the platform that initialization is complete, via the callback.

**Parameters** 
* **elRoot**: DOM element/div ID (String) reference where the engine should paint itself.
* **params**: Startup params (like engine variation/config) passed by platform.
* **adaptor**: Reference to the **adaptor** for communication with platform.
* **htmlLayout**: Html layout template.
* **jsonContent**: Question json (content).
* **callback**: Callback to notify platform when engine initialization is complete.

#### 4.1.2 getConfig()
This function is called by the platform, when it needs information on engine's display characteristic or other configuration settings. 

#### 4.1.3 getStatus()
This function is called by the platform, when it needs to know engine's current state:
 - It is submitted?
 - It is partially saved i.e. not submitted, but user's inputs are saved
 - Not sumbitted, Not saved i.e. user information could be lost (e.g. if browser closes)

#### 4.1.4 handleSubmit() 
This function is called by the platform, when end user presses SUBMIT. This can be used to disable futher interactions by the user and mark the answers. It calls the **activityAdaptor.submitResults()** to inform the platform that item has been submitted.

#### 4.1.5 updateLastSavedResults() 
This function is called by the platform - it is a request to Engine to render the last save results / state. This function is typically called to simulate a RESUME scenario. The engine should expect this function to be called rightafter the completion of init (i.e. the platform callback has been executed). In case FRESH ATTEMPT, this function will NOT be called.

#### 4.1.5 showGrades() 
This function is called by the platform - it is a request to Engine to show grades (correct / wron g answers). The engine should expect this function to be called right after updateLastSavedResults().

**Parameters** 
* **lastResults**: Array of last saved results. Each item of array represent an **interaction**

```javascript

//Example
lastResults = [{"id": "i1","answer": "This is answer 1"},
	       {"id": "i2", "answer": "This is answer 2"}]

//id - Interaction Id
//answer - Interaction data/state

```

### 4.2 Adaptor (platform) functions 
The engine can contact the platform via the  functions available in the adaptor object. 

#### 4.2.1 adapter.savePartialResults()
The engine should call this function to save user's answers - to minimize chances of this data getting lost in the event of browser/tab closing or unexpected page navigation (before user submits).

**Parameters** 
* **interactionArray**: An array of "interactions" object.

```javascript
//Example
interactionArray = [{
            id: interactionId, // interactionId
            answer: "ChoiceC", //Answer given by the user
            score: 1, // Score for the interaction
            maxscore: 1 //Max-score for interaction
        }]
```
* **uniqueId**: UniqueId of the assessment
* **callback**: The function that will be called once the results are saved successfully.


#### 4.2.2 adapter.submitResults()
The engine should call this function to submit user's answers (for grading). There could two types of implementations of SUBMIT.
* Engine owns the SUBMIT button - In this case the engine to bind itself to the submit button and call `submitResults`
* Platform owns the SUBMIT button - In this the platform will notify the engine by calling its public `handleSubmit` function. Engine is responsible to in-turn call `adaptor.submitResults` as part of the `handleSubmit` processing.

**Parameters** 

Same as paramters for **adapter.savePartialResults** mentioned above.

#### 4.2.3 adapter.autoResizeActivityIframe()
The engine should call this function when it wants the platform to resize the container frame. This should be used only if your assessment type dynamic UX elements - for example you have a hidden section/div and when its shown, you should call this function to avoid scrolling - requesting the platform to resize the container. 

**Parameters** 
No parameters

## 5. Understanding the EDITOR interface
TODO


## DO's & DONT's
1. Do not inject your own Jquery and Bootstrap. If you need a new version of these dependencies, contact the Iron Fist for more details.
2. Make sure you explicity notify the platform when initialization is complete.
3. Avoid any UX assumptions on WIDTH / HEIGHT or SCROLLBARs. Apply responsive design techniques to ensure best user experience when running in an embedded mode.
4. Remember that your engine is can launched in multiple modes (design upfront for this):
  * First time (fresh attempt)
  * Resuming 
  * Instructor Review mode

## 6. Integrating your Assessment type(s) with your Delivery Application
An assessment type may be used in various modes:
* Single or Multi-question tests with **NO state/history** - Simply use the [Test Runner](https://github.com/comprodls/libs-frontend-testrunner)) to embed your assesment type as a widget. You will need to supply content (question json).
* Single or Multi-question tests **with state/history** (Attempts, Resume, Past scores etc.)- Requires use of comproDLS&trade; PRODUCT & ACTIVITY APIs in coordination with the Test runner.
* **Embedded test** inside text/html/epub/markdown with **NO state/history** - Simply use the [Test Runner](https://github.com/comprodls/libs-frontend-testrunner))
* **Embedded test** inside text/html/epub/markdown **with state/history** - Requires use of comproDLS&trade; PRODUCT & ACTIVITY APIs in coordination with the Test runner. _TODO Embedded Items_

## 7. Integrating your Assessment type(s) with Builder
TODO
 


