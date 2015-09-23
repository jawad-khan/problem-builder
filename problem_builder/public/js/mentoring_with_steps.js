function MentoringWithStepsBlock(runtime, element) {

    var steps = runtime.children(element).filter(
        function(c) { return c.element.className.indexOf('sb-step') > -1; }
    );
    var activeStep = $('.mentoring', element).data('active-step');
    var attemptsTemplate = _.template($('#xblock-attempts-template').html());
    var reviewStep, checkmark, submitDOM, nextDOM, reviewDOM, tryAgainDOM, assessmentMessageDOM, attemptsDOM, submitXHR;

    function isLastStep() {
        return (activeStep === steps.length-1);
    }

    function atReviewStep() {
        return (activeStep === -1);
    }

    function reviewStepPresent() {
        return reviewStep.length > 0;
    }

    function updateActiveStep(newValue) {
        var handlerUrl = runtime.handlerUrl(element, 'update_active_step');
        $.post(handlerUrl, JSON.stringify(newValue))
            .success(function(response) {
                activeStep = response.active_step;
            });
    }

    function updateNumAttempts() {
        var handlerUrl = runtime.handlerUrl(element, 'update_num_attempts');
        $.post(handlerUrl, JSON.stringify({}))
            .success(function(response) {
                attemptsDOM.data('num_attempts', response.num_attempts);
            });
    }

    function handleResults(response) {
        // Update active step so next step is shown on page reload (even if user does not click "Next Step")
        updateActiveStep(activeStep+1);
        if (response.update_attempts) {
            updateNumAttempts();
        }

        // Update UI
        if (response.completed === 'correct') {
            checkmark.addClass('checkmark-correct icon-ok fa-check');
        } else if (response.completed === 'partial') {
            checkmark.addClass('checkmark-partially-correct icon-ok fa-check');
        } else {
            checkmark.addClass('checkmark-incorrect icon-exclamation fa-exclamation');
        }

        submitDOM.attr('disabled', 'disabled');

        nextDOM.removeAttr("disabled");
        if (nextDOM.is(':visible')) { nextDOM.focus(); }

        if (isLastStep()) {
            if (reviewStepPresent()) {
                reviewDOM.removeAttr('disabled');
            } else {
                tryAgainDOM.removeAttr('disabled');
                tryAgainDOM.show();
            }
        }
    }

    function submit() {
        // We do not handle submissions at this level, so just forward to "submit" method of active step
        var step = steps[activeStep];
        step.submit(handleResults);
    }

    function hideAllSteps() {
        for (var i=0; i < steps.length; i++) {
            $(steps[i].element).hide();
        }
    }

    function cleanAll() {
        checkmark.removeClass('checkmark-correct icon-ok fa-check');
        checkmark.removeClass('checkmark-partially-correct icon-ok fa-check');
        checkmark.removeClass('checkmark-incorrect icon-exclamation fa-exclamation');
        hideAllSteps();
        assessmentMessageDOM.html('');
        attemptsDOM.html('');
    }

    function updateDisplay() {
        cleanAll();
        if (atReviewStep()) {
            showAssessmentMessage();
            showReviewStep();
            showAttempts();
        } else {
            showActiveStep();
            validateXBlock();
            nextDOM.attr('disabled', 'disabled');
            if (isLastStep() && reviewStepPresent()) {
                reviewDOM.show();
            }
        }
    }

    function showAssessmentMessage() {
        var data = $('.grade', element).data();
        assessmentMessageDOM.html(data.assessment_message);
    }

    function showReviewStep() {
        reviewStep.show();
        submitDOM.hide();
        nextDOM.hide();
        reviewDOM.hide();
        tryAgainDOM.removeAttr('disabled');
        tryAgainDOM.show();
    }

    function showAttempts() {
        var data = attemptsDOM.data();
        if (data.max_attempts > 0) {
            attemptsDOM.html(attemptsTemplate(data));
        } // Don't show attempts if unlimited attempts available (max_attempts === 0)
    }

    function showActiveStep() {
        var step = steps[activeStep];
        $(step.element).show();
    }

    function onChange() {
        // We do not allow users to modify answers belonging to a step after submitting them:
        // Once an answer has been submitted ("Next Step" button is enabled),
        // start ignoring changes to the answer.
        if (nextDOM.attr('disabled')) {
            validateXBlock();
        }
    }

    function validateXBlock() {
        var isValid = true;
        var step = steps[activeStep];
        if (step) {
            isValid = step.validate();
        }
        if (!isValid) {
            submitDOM.attr('disabled', 'disabled');
        } else {
            submitDOM.removeAttr('disabled');
        }
        if (isLastStep()) {
            nextDOM.hide();
        }
    }

    function initSteps(options) {
        for (var i=0; i < steps.length; i++) {
            var step = steps[i];
            step.initChildren(options);
        }
    }

    function showGrade() {
        cleanAll();
        showAssessmentMessage();
        showReviewStep();
        showAttempts();
        // Disable "Try again" button if no attempts left
        var data = attemptsDOM.data();
        if (data.max_attempts > 0 && data.num_attempts >= data.max_attempts) {
            tryAgainDOM.attr("disabled", "disabled");
        }
    }

    function handleTryAgain(result) {
        activeStep = result.active_step;
        updateDisplay();
        reviewStep.hide();
        tryAgainDOM.hide();
        submitDOM.show();
        if (! isLastStep()) {
            nextDOM.show();
            reviewDOM.hide();
        }
    }

    function tryAgain() {
        var handlerUrl = runtime.handlerUrl(element, 'try_again');
        if (submitXHR) {
            submitXHR.abort();
        }
        submitXHR = $.post(handlerUrl, JSON.stringify({})).success(handleTryAgain);
    }

    function initXBlockView() {
        reviewStep = $('.sb-review-step', element);
        reviewStep.hide();

        checkmark = $('.assessment-checkmark', element);

        submitDOM = $(element).find('.submit .input-main');
        submitDOM.on('click', submit);
        submitDOM.show();

        nextDOM = $(element).find('.submit .input-next');
        nextDOM.on('click', updateDisplay);
        nextDOM.show();

        reviewDOM = $(element).find('.submit .input-review');
        reviewDOM.on('click', showGrade);

        tryAgainDOM = $(element).find('.submit .input-try-again');
        tryAgainDOM.on('click', tryAgain);

        assessmentMessageDOM = $('.assessment-message', element);
        attemptsDOM = $('.attempts', element);

        var options = {
            onChange: onChange
        };
        initSteps(options);

        updateDisplay();
    }

    initXBlockView();

}
