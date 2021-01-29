//project type
enum ProjectStatus {
  Active,
  Finished
}

interface IProject {
  id: string;
  title: string;
  description: string;
  people: number;
  status: ProjectStatus;
}

class Project {
  constructor(public project: IProject) {
    
  }
}

//state management
type Listener = (items: Project[]) => void;

class State {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: State

  private constructor() {

  }

  static getInstance() {
    if(this.instance){
      return this.instance;
    }
    this.instance = new State();
    return this.instance;
  }

  addListener(listenerFunc: Listener) {
    this.listeners.push(listenerFunc);
  }

  public addProject(title: string, description: string, people: number) {
    const newProject = new Project(
      {id: Math.random().toString(),
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

//validator
interface IValidate {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

const validate = (input: IValidate) => {
  let isValid = true;
  if(input.required) {
    isValid = isValid && input.value.toString().trim().length !== 0;
  }
  if(input.minLength != null && typeof input.value === 'string') {
    isValid = isValid && input.value.length >= input.minLength;
  }
  if(input.maxLength != null && typeof input.value === 'string') {
    isValid = isValid && input.value.length <= input.maxLength;
  }
  if(input.min != null && typeof input.value === 'number') {
    isValid = isValid && input.value >= input.min;
  }
  if(input.max != null && typeof input.value === 'number') {
    isValid = isValid && input.value <= input.max;
  }
  return isValid;
}

//decorator
const AutoBind = (
  _: any, 
  _2: string, 
  descriptior: PropertyDescriptor
  ) => {
  const originalMethod = descriptior.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFunc = originalMethod.bind(this);
      return boundFunc;
    }
  };
  return adjDescriptor;
}

//project list
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[];
    
  constructor(private type: 'active' | 'finished') {
    this.templateElement = <HTMLTemplateElement>document.getElementById('project-list');
    this.hostElement = <HTMLDivElement>document.getElementById('app');
    this.assignedProjects = [];

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = <HTMLElement>importedNode.firstElementChild;
    this.element.id = `${this.type}-input`;

    projectState.addListener((projects: Project[]) => {
      this.assignedProjects = projects;
      this.renderProjects();
    })

    this.attach();
    this.renderContent();
  }
  
  private renderProjects() {
    const listElement = <HTMLUListElement>document.getElementById(`${this.type}-projects-list`);
    this.assignedProjects.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = item.project.title;
      listElement.appendChild(listItem);
    })
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
  }
  
  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }

}

//project input
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = <HTMLTemplateElement>document.getElementById('project-input');
    this.hostElement = <HTMLDivElement>document.getElementById('app');

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = <HTMLFormElement>importedNode.firstElementChild;
    this.element.id = 'user-input';

    this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title');
    this.descriptionInputElement = <HTMLInputElement>this.element.querySelector('#description');
    this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people');

    this.configure()
    this.attach();
  }

  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const validateTitle: IValidate = {
      value: enteredTitle,
      required: true
    }

    const validateDescription: IValidate = {
      value: enteredDescription,
      required: true,
      minLength: 5
    }

    const validatePeople: IValidate = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5
    }

    if(
      !validate(validateTitle) 
      ||
      !validate(validateDescription) 
      ||
      !validate(validatePeople) 
    ) {
      alert('Invalid input!');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInputFields() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  @AutoBind
  //could have submitHandler as arrow function 
  //instead of creating this decorator and/or use .bind()
  private submitHandler(e: Event) {
    e.preventDefault();
    const userInput = this.gatherUserInput();
    if(Array.isArray(userInput)){
      const [title, description, people] = userInput;
      projectState.addProject(title, description, people);
      this.clearInputFields();
    }
  }

  private configure() {
    this.element.addEventListener('submit', this.submitHandler)
  }

  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
