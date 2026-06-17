(function checkAccess() {
    const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    const currentUser = sessionStorage.getItem('currentUser');
    const userRecord = users.find(u => u.username === currentUser);

    // Not logged in
    if (sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.replace('login.html');
        return;
    }

    // localStorage was cleared — user record is gone, force logout
    if (!userRecord) {
        sessionStorage.clear();
        window.location.replace('login.html');
        return;
    }

    // go to result
    if (userRecord.hasFinished) {
        const score = userRecord.score || 0;
        localStorage.removeItem('quiz_end_time');
        window.location.replace(score >= 5 ? 'success.html' : 'failed.html');
        return;
    }

    //  stay in quiz no matter what
    document.body.style.display = 'grid';
})();

// no go back
history.pushState(null, null, location.href);
window.addEventListener('popstate', function () {
    history.pushState(null, null, location.href);
});


// qq
var questionsData = [
    {
        question: "Which word is a noun (a person, place, or thing)?",
        options: [{ text: "Run", isCorrect: false }, { text: "Big", isCorrect: false }, { text: "Table", isCorrect: true }, { text: "Fast", isCorrect: false }]
    },
    {
        question: "Which word is an action verb?",
        options: [{ text: "Jump", isCorrect: true }, { text: "Blue", isCorrect: false }, { text: "Happy", isCorrect: false }, { text: "Car", isCorrect: false }]
    },
    {
        question: "Which sentence is correct?",
        options: [{ text: "She go to school.", isCorrect: false }, { text: "She goes to school.", isCorrect: true }, { text: "She going to school.", isCorrect: false }, { text: "She to school goes.", isCorrect: false }]
    },
    {
        question: "What is the opposite of 'Hot'?",
        options: [{ text: "Large", isCorrect: false }, { text: "Cold", isCorrect: true }, { text: "Hard", isCorrect: false }, { text: "Tall", isCorrect: false }]
    },
    {
        question: "Choose the correct pronoun: '____ am a student.'",
        options: [{ text: "He", isCorrect: false }, { text: "They", isCorrect: false }, { text: "I", isCorrect: true }, { text: "You", isCorrect: false }]
    },
    {
        question: "Which word describes a color?",
        options: [{ text: "Apple", isCorrect: false }, { text: "Green", isCorrect: true }, { text: "Slow", isCorrect: false }, { text: "Book", isCorrect: false }]
    },
    {
        question: "Which word is an adjective (a describing word)?",
        options: [{ text: "Happy", isCorrect: true }, { text: "Eat", isCorrect: false }, { text: "Dog", isCorrect: false }, { text: "Walk", isCorrect: false }]
    },
    {
        question: "What is the plural of 'Cat'?",
        options: [{ text: "Caties", isCorrect: false }, { text: "Cates", isCorrect: false }, { text: "Cats", isCorrect: true }, { text: "Cat", isCorrect: false }]
    },
    {
        question: "Which of these is a place?",
        options: [{ text: "Read", isCorrect: false }, { text: "School", isCorrect: true }, { text: "Sleep", isCorrect: false }, { text: "Nice", isCorrect: false }]
    },
    {
        question: "What ends this sentence: 'Where are you ____?'",
        options: [{ text: "go", isCorrect: false }, { text: "going", isCorrect: true }, { text: "went", isCorrect: false }, { text: "goes", isCorrect: false }]
    }
];

var quizQuestions = [];
var currentIndex = 0;
var selectedAnswers = {};
var markedQuestions = [];
var hasAttemptedNext = [];
var timeLeft = 0;
var timerInterval;


// savin
function saveProgressLocally() {
    var currentScore = 0;
    quizQuestions.forEach((q, i) => {
        var sel = selectedAnswers[i];
        if (sel !== undefined && q.options[sel].isCorrect) {
            currentScore++;
        }
    });

    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    let currentUser = sessionStorage.getItem('currentUser');
    let userIdx = users.findIndex(u => u.username === currentUser);

    if (userIdx !== -1) {
        users[userIdx].score = currentScore;
        localStorage.setItem('quiz_users', JSON.stringify(users));
    }
    localStorage.setItem('user_score', currentScore);

    sessionStorage.setItem('selectedAnswers', JSON.stringify(selectedAnswers));
    sessionStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));

    // also save to localStorage under the user's key (survives tab close + re-login)
    var currentUser2 = sessionStorage.getItem('currentUser');
    if (currentUser2) {
        localStorage.setItem('quiz_progress_' + currentUser2, JSON.stringify({
            selectedAnswers: selectedAnswers,
            markedQuestions: markedQuestions,
            quizQuestions: quizQuestions
        }));
    }
}


// timer
function startTimer() {
    var timerSpans = document.querySelectorAll('#timerDisplay span.border');
    var endTime = parseInt(localStorage.getItem('quiz_end_time'));
    timeLeft = Math.floor((endTime - Date.now()) / 1000);
    if (timeLeft <= 0) {
        finishQuiz();
        return;
    }
//showtime
    (function updateDisplay() {
        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        var minStr = minutes.toString().padStart(2, '0');
        var secStr = seconds.toString().padStart(2, '0');
        if (timerSpans.length >= 4) {
            timerSpans[0].textContent = minStr[0];
            timerSpans[1].textContent = minStr[1];
            timerSpans[2].textContent = secStr[0];
            timerSpans[3].textContent = secStr[1];
        }
    })();

    timerInterval = setInterval(function () {
        // nomater how refresh
        endTime = parseInt(localStorage.getItem('quiz_end_time'));
        timeLeft = Math.floor((endTime - Date.now()) / 1000);

        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timerInterval);
            finishQuiz();
            return;
        }

        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        var minStr = minutes.toString().padStart(2, '0');
        var secStr = seconds.toString().padStart(2, '0');

        if (timerSpans.length >= 4) {
            timerSpans[0].textContent = minStr[0];
            timerSpans[1].textContent = minStr[1];
            timerSpans[2].textContent = secStr[0];
            timerSpans[3].textContent = secStr[1];
        }
    }, 1000);
}


// rearange q
function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// quiz
function initQuiz() {
    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    let currentUser = sessionStorage.getItem('currentUser');
    let userIdx = users.findIndex(u => u.username === currentUser);

    if (userIdx !== -1) {
        users[userIdx].hasStarted = true;
        localStorage.setItem('quiz_users', JSON.stringify(users));
    }

    // mark
    sessionStorage.setItem('quizActive', 'true');

    // set time
    if (!localStorage.getItem('quiz_end_time')) {
        var endTime = Date.now() + (10 * 60 * 1000);
        localStorage.setItem('quiz_end_time', endTime);
    }

    // Restore shuffled questions or shuffle fresh
    var savedQuestions = sessionStorage.getItem('quizQuestions');
    if (savedQuestions) {
        quizQuestions = JSON.parse(savedQuestions);
    } else {
        // try restoring full progress from localStorage (survives tab close + re-login)
        var savedProgress = localStorage.getItem('quiz_progress_' + currentUser);
        if (savedProgress) {
            var progress = JSON.parse(savedProgress);
            quizQuestions = progress.quizQuestions;
            selectedAnswers = progress.selectedAnswers || {};
            markedQuestions = progress.markedQuestions || [];
            // also push back into sessionStorage for this session
            sessionStorage.setItem('quizQuestions', JSON.stringify(quizQuestions));
            sessionStorage.setItem('selectedAnswers', JSON.stringify(selectedAnswers));
            sessionStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
        } else {
            var dataCopy = JSON.parse(JSON.stringify(questionsData));
            quizQuestions = shuffle(dataCopy);
            quizQuestions.forEach(q => shuffle(q.options));
            sessionStorage.setItem('quizQuestions', JSON.stringify(quizQuestions));
        }
    }

    // restore selected answers (sessionStorage, for normal reload)
    if (Object.keys(selectedAnswers).length === 0) {
        var savedAnswers = sessionStorage.getItem('selectedAnswers');
        if (savedAnswers) selectedAnswers = JSON.parse(savedAnswers);
    }

    // restore marked questions (sessionStorage, for normal reload)
    if (markedQuestions.length === 0) {
        var savedMarked = sessionStorage.getItem('markedQuestions');
        if (savedMarked) markedQuestions = JSON.parse(savedMarked);
    }

    const userDisplay = document.getElementById('userNameDisplay');
    if (userDisplay) userDisplay.textContent = currentUser;

    renderCurrentQuestion();
    renderSidebar();
    startTimer();
}


// give current
function renderCurrentQuestion() {
    var q = quizQuestions[currentIndex];
    var isLast = currentIndex === quizQuestions.length - 1;

    document.getElementById('questionText').textContent = (currentIndex + 1) + "- " + q.question;
    document.getElementById('progressStep').textContent = (currentIndex + 1) + " / " + quizQuestions.length;

    var nextBtn = document.getElementById('nextBtn');
    var prevBtn = document.getElementById('prevBtn');

    nextBtn.textContent = isLast ? "Submit" : "Next";
    prevBtn.disabled = (currentIndex === 0);
    prevBtn.style.opacity = (currentIndex === 0) ? "0.3" : "1";

    var bookmarkBtn = document.getElementById('bookmarkBtn');
    bookmarkBtn.className = (markedQuestions.indexOf(currentIndex) !== -1)
        ? "p-1.5 bg-orange-500 rounded-lg text-white w-fit cursor-pointer transition-colors"
        : "p-1.5 bg-slate-100 rounded-lg text-indigo-900 w-fit cursor-pointer transition-colors";

    var optionsWrapper = document.getElementById('optionsWrapper');
    optionsWrapper.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach(function (opt, index) {
        var isSelected = selectedAnswers[currentIndex] === index;
        var btn = document.createElement('button');

        btn.className = isSelected
            ? "w-full text-left p-3 md:p-4 text-sm border-2 border-indigo-500 rounded-xl bg-indigo-50 text-indigo-900 font-semibold shadow-sm"
            : "w-full text-left p-3 md:p-4 text-sm border-2 border-slate-100 rounded-xl bg-white hover:border-indigo-200 transition-colors";

        btn.textContent = letters[index] + " - " + opt.text;

        btn.onclick = function () {
            selectedAnswers[currentIndex] = index;
            saveProgressLocally();
            renderCurrentQuestion();
            renderSidebar();
        };
        optionsWrapper.appendChild(btn);
    });
}


// sidebar
function renderSidebar() {
    var sidebarGrid = document.getElementById('sidebarGrid');
    sidebarGrid.innerHTML = '';
    quizQuestions.forEach(function (_, index) {
        var qBox = document.createElement('div');
        qBox.textContent = "Q" + (index + 1);
        var isUnanswered = selectedAnswers[index] === undefined;
        var wasSkipped = hasAttemptedNext.includes(index);

        let classes = "aspect-square grid place-items-center rounded-lg text-[10px] font-bold cursor-pointer transition-all border-2 ";

        if (index === currentIndex) classes += "bg-indigo-900 text-white border-indigo-900 shadow-md";
        else if (markedQuestions.indexOf(index) !== -1) classes += "bg-orange-500 text-white border-orange-500 ring-2 ring-orange-200";
        else if (!isUnanswered) classes += "bg-indigo-100 text-indigo-900 border-indigo-100";
        else classes += "bg-white text-slate-400 " + (wasSkipped ? "border-red-500" : "border-slate-200");

        qBox.className = classes;
        qBox.onclick = function () { currentIndex = index; renderCurrentQuestion(); renderSidebar(); };
        sidebarGrid.appendChild(qBox);
    });
}


// sumbit
function finishQuiz() {
    clearInterval(timerInterval);
    saveProgressLocally();

    // delet stuff
    localStorage.removeItem('quiz_end_time');
    sessionStorage.removeItem('quizActive');
    sessionStorage.removeItem('quizQuestions');
    sessionStorage.removeItem('selectedAnswers');
    sessionStorage.removeItem('markedQuestions');

    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    let currentUser = sessionStorage.getItem('currentUser');
    let userIdx = users.findIndex(u => u.username === currentUser);

    // clear the persisted progress for this user
    if (currentUser) localStorage.removeItem('quiz_progress_' + currentUser);

    var score = parseInt(localStorage.getItem('user_score')) || 0;

    if (userIdx !== -1) {
        users[userIdx].hasFinished = true;
        users[userIdx].score = score;
        localStorage.setItem('quiz_users', JSON.stringify(users));
    }

    localStorage.setItem('total_questions', quizQuestions.length);
    window.location.replace(score >= 5 ? 'success.html' : 'failed.html');
}


document.addEventListener('DOMContentLoaded', function () {
    initQuiz();

    document.getElementById('nextBtn').onclick = function () {
        if (selectedAnswers[currentIndex] === undefined) {
            if (!hasAttemptedNext.includes(currentIndex)) hasAttemptedNext.push(currentIndex);
        }

        if (currentIndex < quizQuestions.length - 1) {
            currentIndex++;
            renderCurrentQuestion();
            renderSidebar();
        } else {
            let unanswered = [];
            for (let i = 0; i < quizQuestions.length; i++) {
                if (selectedAnswers[i] === undefined) unanswered.push(i + 1);
            }

            if (unanswered.length > 0) {
                alert("Please answer all questions before submitting. Missing: " + unanswered.join(", "));
                renderSidebar();
            } else {
                if (confirm("Are you sure you want to submit your exam?")) finishQuiz();
            }
        }
    };

    document.getElementById('prevBtn').onclick = function () {
        if (currentIndex > 0) {
            currentIndex--;
            renderCurrentQuestion();
            renderSidebar();
        }
    };

    document.getElementById('bookmarkBtn').onclick = function () {
        var idx = markedQuestions.indexOf(currentIndex);
        if (idx !== -1) markedQuestions.splice(idx, 1);
        else markedQuestions.push(currentIndex);
        saveProgressLocally();
        renderCurrentQuestion();
        renderSidebar();
    };

    const submitBtn = document.getElementById('submitExam');
    if (submitBtn) submitBtn.onclick = () => {
        if (confirm("Do you want to end the exam now?")) finishQuiz();
    };
});


window.addEventListener("beforeunload", function () {
    // only save progress, never mark as finished here
    // finishing only happens via finishQuiz() or when the timer hits zero
    if (sessionStorage.getItem('quizActive') === 'true') {
        saveProgressLocally();
    }
});
//<!-- was made by Tasnim hussam & zena hefny -->