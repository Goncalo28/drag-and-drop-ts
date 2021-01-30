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
        this.updateListeners();
    }
    moveProject(projectId, newStatus) {
        const foundProject = this.projects.find(data => data.project.id === projectId);
        if (foundProject && foundProject.project.status !== newStatus) {
            foundProject.project.status = newStatus;
            this.updateListeners();
        }
    }
    updateListeners() {
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
class Component {
    constructor(templatedId, hostElementId, insertAtStart, newElementId) {
        this.templateElement = document.getElementById(templatedId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }
    attach(insertAtBegin) {
        this.hostElement.insertAdjacentElement(insertAtBegin ? 'afterbegin' : 'beforeend', this.element);
    }
}
class ProjectItem extends Component {
    constructor(hostId, item) {
        super('single-project', hostId, false, item.project.id);
        this.configure = () => {
            this.element.addEventListener('dragstart', this.dragStartHandler);
            this.element.addEventListener('dragend', this.dragEndHandler);
        };
        this.projectData = item;
        this.configure();
        this.renderContent();
    }
    get people() {
        return this.projectData.project.people === 1 ?
            '1 person' :
            `${this.projectData.project.people} persons`;
    }
    dragStartHandler(e) {
        e.dataTransfer.setData('text/plain', this.projectData.project.id);
        e.dataTransfer.effectAllowed = 'move';
    }
    dragEndHandler(_) {
        console.log('DragEnd');
    }
    renderContent() {
        this.element.querySelector('h2').textContent = this.projectData.project.title;
        this.element.querySelector('h3').textContent = `${this.people} assigned`;
        this.element.querySelector('p').textContent = this.projectData.project.description;
    }
}
__decorate([
    AutoBind
], ProjectItem.prototype, "dragStartHandler", null);
class ProjectList extends Component {
    constructor(type) {
        super('project-list', 'app', false, `${type}-input`);
        this.type = type;
        this.dropHandler = (e) => {
            const projectId = e.dataTransfer.getData('text/plain');
            projectState.moveProject(projectId, this.type === 'active' ?
                ProjectStatus.Active : ProjectStatus.Finished);
        };
        this.dragLeaveHandler = (_) => {
            const listElement = this.element.querySelector('ul');
            listElement.classList.remove('droppable');
        };
        this.dragOverHandler = (e) => {
            if (e.dataTransfer && e.dataTransfer.types[0] === 'text/plain') {
                e.preventDefault();
                const listElement = this.element.querySelector('ul');
                listElement.classList.add('droppable');
            }
        };
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }
    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        projectState.addListener((projects) => {
            const filteredProjects = projects.filter(item => {
                if (this.type === 'active') {
                    return item.project.status === ProjectStatus.Active;
                }
                return item.project.status === ProjectStatus.Finished;
            });
            this.assignedProjects = filteredProjects;
            this.renderProjects();
        });
    }
    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul').id = listId;
        this.element.querySelector('h2').textContent = this.type.toUpperCase() + ' PROJECTS';
    }
    renderProjects() {
        const listElement = document.getElementById(`${this.type}-projects-list`);
        listElement.innerHTML = '';
        this.assignedProjects.forEach(item => {
            new ProjectItem(this.element.querySelector('ul').id, item);
        });
    }
}
class ProjectInput extends Component {
    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleInputElement = this.element.querySelector('#title');
        this.descriptionInputElement = this.element.querySelector('#description');
        this.peopleInputElement = this.element.querySelector('#people');
        this.configure();
    }
    renderContent() { }
    ;
    configure() {
        this.element.addEventListener('submit', this.submitHandler);
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
            alert('Invalid input! \nDescription must be at least 5 characters long. \nMust have at least 1 person and not more than 5');
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
}
__decorate([
    AutoBind
], ProjectInput.prototype, "submitHandler", null);
const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
//# sourceMappingURL=app.js.map