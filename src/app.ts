//drag and drop interfaces
interface IDrag {
  dragStartHandler(e: DragEvent): void;
  dragEndHandler(e: DragEvent): void;
}

interface IDragTarget {
  dragOverHandler(e: DragEvent): void;
  dropHandler(e: DragEvent): void;
  dragLeaveHandler(e: DragEvent): void;
}



//project interface
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

class Project { constructor( public project: IProject ) {} }

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
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const foundProject = this.projects.find(data => data.project.id === projectId);
    if (foundProject && foundProject.project.status !== newStatus) {
      foundProject.project.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
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

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(templatedId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
    this.templateElement = <HTMLTemplateElement>document.getElementById(templatedId);
    this.hostElement = <T>document.getElementById(hostElementId);

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = <U>importedNode.firstElementChild;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart)
  }

  private attach(insertAtBegin: boolean) {
    this.hostElement.insertAdjacentElement(insertAtBegin ? 'afterbegin' : 'beforeend', this.element);
  }

  abstract configure(): void;

  abstract renderContent(): void;

}



//project item 
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements IDrag {
  private projectData: Project;
  
  get people() {
    return this.projectData.project.people === 1 ? 
    '1 person' : 
    `${this.projectData.project.people} persons`;
  }

  constructor(hostId: string, item: Project){
    super('single-project', hostId, false, item.project.id);
    this.projectData = item;

    this.configure();
    this.renderContent();
  }

  @AutoBind
  dragStartHandler(e: DragEvent) {
    e.dataTransfer!.setData('text/plain', this.projectData.project.id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_: DragEvent) {
    console.log('DragEnd')
  }

  configure = () => {
    this.element.addEventListener('dragstart', this.dragStartHandler);
    this.element.addEventListener('dragend', this.dragEndHandler);
  }

  renderContent() {
    this.element.querySelector('h2')!.textContent = this.projectData.project.title;
    this.element.querySelector('h3')!.textContent = `${this.people} assigned`;
    this.element.querySelector('p')!.textContent = this.projectData.project.description; 
  }
}
 


//project list
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements IDragTarget {
  assignedProjects: Project[];
    
  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false,`${type}-input`);
    this.assignedProjects = [];
    this.configure();
    this.renderContent();
  }

  dropHandler = (e: DragEvent) => {
    const projectId = e.dataTransfer!.getData('text/plain');
    projectState.moveProject(projectId, this.type === 'active' ? 
    ProjectStatus.Active : ProjectStatus.Finished);
  }

  dragLeaveHandler = (_: DragEvent) => {
    const listElement = this.element.querySelector('ul')!;
    listElement.classList.remove('droppable');
  }

  dragOverHandler = (e: DragEvent) => {
    if(e.dataTransfer && e.dataTransfer.types[0] === 'text/plain'){
      e.preventDefault();
      const listElement = this.element.querySelector('ul')!;
      listElement.classList.add('droppable');
    }
  }
  
  configure() {
    this.element.addEventListener('dragover', this.dragOverHandler);
    this.element.addEventListener('dragleave', this.dragLeaveHandler);
    this.element.addEventListener('drop', this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const filteredProjects = projects.filter(item => {
        if(this.type === 'active'){
          return item.project.status === ProjectStatus.Active;
        }
        return item.project.status === ProjectStatus.Finished;
      })
      this.assignedProjects = filteredProjects;
      this.renderProjects();
    })
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
  }

  private renderProjects() {
    const listElement = <HTMLUListElement>document.getElementById(`${this.type}-projects-list`);
    listElement.innerHTML = '';
    this.assignedProjects.forEach(item => {
      new ProjectItem(this.element.querySelector('ul')!.id, item);
    })
  }
}



//project input
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');

    this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title');
    this.descriptionInputElement = <HTMLInputElement>this.element.querySelector('#description');
    this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people');
    
    this.configure();
  }

  renderContent() {};

  configure()  {
    this.element.addEventListener('submit', this.submitHandler)
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
      alert('Invalid input! \nDescription must be at least 5 characters long. \nMust have at least 1 person and not more than 5');
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
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
