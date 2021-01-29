"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
class Project {
    constructor(project) {
        this.project = project;
    }
}
class State {
    constructor() {
        this.listeners = [];
        this.projects = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new State();
        return this.instance;
    }
    addListener(listenerFunc) {
        this.listeners.push(listenerFunc);
    }
    addProject(title, description, people) {
        const newProject = new Project({ id: Math.random().toString(),
            title,
            description,
            people,
            status: ProjectStatus.Active
        });
        this.projects.push(newProject);
        this.listeners.forEach(listenerFunc => listenerFunc([...this.projects]));
    }
}
const projectState = State.getInstance();
const validate = (input) => {
    let isValid = true;
    if (input.required) {
        isValid = isValid && input.value.toString().trim().length !== 0;
    }
    if (input.minLength != null && typeof input.value === 'string') {
        isValid = isValid && input.value.length >= input.minLength;
    }
    if (input.maxLength != null && typeof input.value === 'string') {
        isValid = isValid && input.value.length <= input.maxLength;
    }
    if (input.min != null && typeof input.value === 'number') {
        isValid = isValid && input.value >= input.min;
    }
    if (input.max != null && typeof input.value === 'number') {
        isValid = isValid && input.value <= input.max;
    }
    return isValid;
};
const AutoBind = (_, _2, descriptior) => {
    const originalMethod = descriptior.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            const boundFunc = originalMethod.bind(this);
            return boundFunc;
        }
    };
    return adjDescriptor;
};
class ProjectList {
    constructor(type) {
        this.type = type;
        this.templateElement = document.getElementById('project-list');
        this.hostElement = document.getElementById('app');
        this.assignedProjects = [];
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        this.element.id = `${this.type}-input`;
        projectState.addListener((projects) => {
            this.assignedProjects = projects;
            this.renderProjects();
        });
        this.attach();
        this.renderContent();
    }
    renderProjects() {
        const listElement = document.getElementById(`${this.type}-projects-list`);
        this.assignedProjects.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item.project.title;
            listElement.appendChild(listItem);
        });
    }
    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul').id = listId;
        this.element.querySelector('h2').textContent = this.type.toUpperCase() + ' PROJECTS';
    }
    attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}
class ProjectInput {
    constructor() {
        this.templateElement = document.getElementById('project-input');
        this.hostElement = document.getElementById('app');
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        this.element.id = 'user-input';
        this.titleInputElement = this.element.querySelector('#title');
        this.descriptionInputElement = this.element.querySelector('#description');
        this.peopleInputElement = this.element.querySelector('#people');
        this.configure();
        this.attach();
    }
    gatherUserInput() {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;
        const validateTitle = {
            value: enteredTitle,
            required: true
        };
        const validateDescription = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const validatePeople = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        };
        if (!validate(validateTitle)
            ||
                !validate(validateDescription)
            ||
                !validate(validatePeople)) {
            alert('Invalid input!');
            return;
        }
        else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }
    clearInputFields() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }
    submitHandler(e) {
        e.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people);
            this.clearInputFields();
        }
    }
    configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }
    attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}
__decorate([
    AutoBind
], ProjectInput.prototype, "submitHandler", null);
const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
//# sourceMappingURL=app.js.map