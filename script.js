document.getElementById('handleForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const handle = document.getElementById('handle').value;
    const resultsDiv = document.getElementById('results');
    const loadingSpinner = document.getElementById('loadingSpinner');

    resultsDiv.innerHTML = '';
    loadingSpinner.style.display = 'block';

    try {
        const submissions = await fetchUserSubmissions(handle, 1, 10000);
        const solvedProblemsByRating = countSolvedProblemsByRating(submissions, problemDict);
        updateResults(solvedProblemsByRating, problemDict);
    } catch (error) {
        showError(error.message);
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

async function fetchUserSubmissions(handle, from, count) {
    const url = `https://codeforces.com/api/user.status?handle=${handle}&from=${from}&count=${count}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        if (data.status !== "OK") throw new Error(data.comment || 'An error occurred');
        return data.result;
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

function countSolvedProblemsByRating(submissions, problemDict) {
    const solvedProblems = {};
    for (const rating in problemDict) {
        solvedProblems[rating] = new Set();
    }

    for (const submission of submissions) {
        if (submission.verdict === "OK") {
            const contestId = submission.problem.contestId;
            const index = submission.problem.index;

            for (const rating in problemDict) {
                for (const problem of problemDict[rating]) {
                    if (problem[0] === contestId && problem[1] === index) {
                        solvedProblems[rating].add(`${contestId}-${index}`);
                        break;
                    }
                }
            }
        }
    }

    const ratingCounts = {};
    for (const rating in problemDict) {
        ratingCounts[rating] = solvedProblems[rating].size;
    }

    return ratingCounts;
}

function updateResults(solvedProblemsByRating, problemDict) {
    const resultsDiv = document.getElementById('results');
    let resultsHTML = '';

    for (const rating of Object.keys(problemDict).sort((a, b) => a - b)) {
        const solvedCount = solvedProblemsByRating[rating] || 0;
        const totalProblems = problemDict[rating].length;
        const progressPercent = (solvedCount / totalProblems) * 100;

        resultsHTML += `
            <div class="result-row">
                <span>Rating: ${rating}</span>
                <span>${solvedCount}/${totalProblems}</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${progressPercent}%;"></div>
            </div>
        `;
    }

    resultsDiv.innerHTML = resultsHTML;
}

function showError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="error">${message}</div>`;
}