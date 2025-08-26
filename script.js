// Grade Tracker for Psychology Students

class GradeTracker {
    constructor() {
        this.courses = this.loadCourses();
        this.init();
    }

    init() {
        this.renderCourses();
        this.updateGPA();
    }

    // Save courses to localStorage
    saveCourses() {
        localStorage.setItem('psychologyGrades', JSON.stringify(this.courses));
    }

    // Load courses from localStorage
    loadCourses() {
        const saved = localStorage.getItem('psychologyGrades');
        return saved ? JSON.parse(saved) : [];
    }

    // Add a new course
    addCourse(name, credits) {
        if (!name.trim()) {
            alert('Please enter a course name');
            return;
        }

        const course = {
            id: Date.now(),
            name: name.trim(),
            credits: parseInt(credits) || 3,
            grades: []
        };

        this.courses.push(course);
        this.saveCourses();
        this.renderCourses();
        this.updateGPA();

        // Clear input fields
        document.getElementById('course-name').value = '';
        document.getElementById('course-credits').value = '3';
    }

    // Delete a course
    deleteCourse(courseId) {
        if (confirm('Are you sure you want to delete this course? All grades will be lost.')) {
            this.courses = this.courses.filter(course => course.id !== courseId);
            this.saveCourses();
            this.renderCourses();
            this.updateGPA();
        }
    }

    // Add a grade to a course
    addGrade(courseId, assignment, grade) {
        if (!assignment.trim() || !grade) {
            alert('Please enter both assignment name and grade');
            return;
        }

        const gradeValue = parseFloat(grade);
        if (gradeValue < 0 || gradeValue > 100) {
            alert('Grade must be between 0 and 100');
            return;
        }

        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            course.grades.push({
                id: Date.now(),
                assignment: assignment.trim(),
                grade: gradeValue
            });
            this.saveCourses();
            this.renderCourses();
            this.updateGPA();
        }
    }

    // Remove a grade from a course
    removeGrade(courseId, gradeId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            course.grades = course.grades.filter(g => g.id !== gradeId);
            this.saveCourses();
            this.renderCourses();
            this.updateGPA();
        }
    }

    // Calculate course average
    calculateCourseAverage(course) {
        if (course.grades.length === 0) return 0;
        const sum = course.grades.reduce((total, grade) => total + grade.grade, 0);
        return sum / course.grades.length;
    }

    // Convert percentage to GPA (4.0 scale)
    percentageToGPA(percentage) {
        if (percentage >= 97) return 4.0;
        if (percentage >= 93) return 3.7;
        if (percentage >= 90) return 3.3;
        if (percentage >= 87) return 3.0;
        if (percentage >= 83) return 2.7;
        if (percentage >= 80) return 2.3;
        if (percentage >= 77) return 2.0;
        if (percentage >= 73) return 1.7;
        if (percentage >= 70) return 1.3;
        if (percentage >= 67) return 1.0;
        if (percentage >= 65) return 0.7;
        return 0.0;
    }

    // Calculate overall GPA
    calculateGPA() {
        if (this.courses.length === 0) return { gpa: 0, totalCredits: 0 };

        let totalGradePoints = 0;
        let totalCredits = 0;

        this.courses.forEach(course => {
            if (course.grades.length > 0) {
                const average = this.calculateCourseAverage(course);
                const gpa = this.percentageToGPA(average);
                totalGradePoints += gpa * course.credits;
                totalCredits += course.credits;
            }
        });

        return {
            gpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0,
            totalCredits
        };
    }

    // Update GPA display
    updateGPA() {
        const { gpa, totalCredits } = this.calculateGPA();
        document.getElementById('current-gpa').textContent = gpa.toFixed(2);
        document.getElementById('total-credits').textContent = totalCredits;
    }

    // Get grade color based on percentage
    getGradeColor(percentage) {
        if (percentage >= 90) return '#48bb78'; // Green
        if (percentage >= 80) return '#ed8936'; // Orange
        if (percentage >= 70) return '#ecc94b'; // Yellow
        return '#e53e3e'; // Red
    }

    // Render all courses
    renderCourses() {
        const container = document.getElementById('courses-container');
        
        if (this.courses.length === 0) {
            container.innerHTML = `
                <div class="no-courses">
                    <p>No courses added yet. Add your first psychology course above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.courses.map(course => {
            const average = this.calculateCourseAverage(course);
            const gpa = this.percentageToGPA(average);
            const gradeColor = this.getGradeColor(average);

            return `
                <div class="course-card">
                    <div class="course-header">
                        <div class="course-name">${course.name}</div>
                        <div class="course-average" style="color: ${gradeColor}">
                            ${course.grades.length > 0 ? average.toFixed(1) + '%' : 'No grades'}
                        </div>
                    </div>
                    
                    <div class="course-info">
                        <div>Credits: ${course.credits}</div>
                        <div>GPA: ${course.grades.length > 0 ? gpa.toFixed(2) : 'N/A'}</div>
                        <div>Assignments: ${course.grades.length}</div>
                        <button class="delete-course" onclick="gradeTracker.deleteCourse(${course.id})">
                            Delete Course
                        </button>
                    </div>

                    <div class="grade-entry">
                        <input type="text" placeholder="Assignment name" id="assignment-${course.id}">
                        <input type="number" placeholder="Grade (0-100)" min="0" max="100" step="0.1" id="grade-${course.id}">
                        <button onclick="gradeTracker.addGradeFromInput(${course.id})">Add Grade</button>
                    </div>

                    <div class="grades-list">
                        ${course.grades.map(grade => `
                            <div class="grade-item">
                                <span>${grade.assignment}:</span>
                                <span class="grade-value">${grade.grade}%</span>
                                <button class="remove-grade" onclick="gradeTracker.removeGrade(${course.id}, ${grade.id})" title="Remove grade">
                                    ×
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Helper method to add grade from input fields
    addGradeFromInput(courseId) {
        const assignmentInput = document.getElementById(`assignment-${courseId}`);
        const gradeInput = document.getElementById(`grade-${courseId}`);
        
        const assignment = assignmentInput.value;
        const grade = gradeInput.value;

        if (assignment && grade) {
            this.addGrade(courseId, assignment, parseFloat(grade));
            assignmentInput.value = '';
            gradeInput.value = '';
        }
    }
}

// Initialize the grade tracker
const gradeTracker = new GradeTracker();

// Global functions for HTML onclick events
function addCourse() {
    const name = document.getElementById('course-name').value;
    const credits = document.getElementById('course-credits').value;
    gradeTracker.addCourse(name, credits);
}

// Add enter key support for course input
document.getElementById('course-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addCourse();
    }
});

document.getElementById('course-credits').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addCourse();
    }
});

// Add enter key support for grade inputs
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.id.startsWith('assignment-')) {
        const courseId = e.target.id.split('-')[1];
        gradeTracker.addGradeFromInput(parseInt(courseId));
    } else if (e.key === 'Enter' && e.target.id.startsWith('grade-')) {
        const courseId = e.target.id.split('-')[1];
        gradeTracker.addGradeFromInput(parseInt(courseId));
    }
});