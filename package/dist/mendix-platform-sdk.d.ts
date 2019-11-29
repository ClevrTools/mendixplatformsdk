/// <reference types="when" />
import { ModelSdkClient, IModel } from "@gajduk/mendixmodelsdk";
/**
 * The state of the background job:
 *
 * - Running: the job has been submitted for execution
 * - Completed: the job has been successfully completed
 * - Failed: the job has finished with an error
 */
export declare enum JobState {
    Running = 0,
    Completed = 1,
    Failed = 2
}
/**
 * Client class that provides access to all Platform and Model APIs.
 */
export declare class MendixSdkClient {
    private _platformSdkClient;
    private _modelSdkClient;
    private _options;
    private static DEFAULT_PROJECTSAPI_ENDPOINT;
    private static DEFAULT_POLL_DELAY;
    /**
     * Create a new client to access [Mendix](developer.mendix.com) Platform and Model APIs.
     *
     * @param username Username of your account (same as username used to log in to the Mendix Development Portal)
     * @param apikey API key for your account.
     * @param password Alternative way to authenticate with username, password and openid
     * @param openid Alternative way to authenticate with username, password and openid
     * @param projectsApiEndpoint For internal use. Connects to a custom instance of the Projects API.
     * @param modelServerEndpoint For internal use. Connects to a custom instance of the Model API.
     * @param options a JSON object containing configuration options for the SDK Client.
     */
    constructor(username: string, apikey?: string, password?: string, openid?: string, projectsApiEndpoint?: string, modelServerEndpoint?: string, options?: SdkOptions);
    platform(): PlatformSdkClient;
    model(): ModelSdkClient;
    options(): SdkOptions;
}
export declare class PlatformSdkClient {
    private _client;
    private _username;
    private _apikey;
    private _projectsApiEndpoint;
    private _xmlParser;
    private static _templatePath;
    private static PROJECTS_API_PATH;
    private static HTTP_STATUS_OK_RESPONSE_CODE;
    private static HTTP_STATUS_WS_ERROR_RESPONSE_CODE;
    private static createNewAppXml;
    private static deleteAppXml;
    private static createOnlineWorkingCopyXml;
    private static commitWorkingCopyChangesXml;
    private static retrieveJobStatusXml;
    constructor(client: MendixSdkClient, username: string, apikey: string | undefined, projectsApiEndpoint: string);
    /**
     * Creates a new app and commits it to the Team Server.
     *
     * @param projectName The name of the new app
     * @param projectSummary (Optional) A short description of the new app
     * @returns a Promise of a Mendix App Project
     */
    createNewApp(projectName: string, projectSummary?: string, templateUUID?: string): When.Promise<Project>;
    /**
     * Deletes an application, including all resources that are associated with it, like the Team Server repository, cloud nodes,
     * and all model server working copies. The operation can only be called by someone who has administrative permissions on the
     * project (usually the user that created the project).
     *
     * @param appId The App ID of the app in the Platform Portal.
     * @returns a Promise of void
     */
    deleteApp(appId: string): When.Promise<void>;
    /**
     * Expose a specific Team Server revision as an Online Working Copy.
     *
     * @param project an instance of a Mendix App Project
     * @param revision A Revision instance pointing to a revision number on a specific Team Server branch
     * @returns a Promise of an OnlineWorkingCopy in the Mendix Model Server corresponding to the given project and revision.
     */
    createOnlineWorkingCopy(project: Project, revision?: Revision): When.Promise<OnlineWorkingCopy>;
    /**
     * Commit changes in your Online Working Copy to your model back to the Team Server.
     *
     * @param workingCopy an OnlineWorkingCopy instance pointing to a working copy on the Mendix Model server.
     * @param branchName (Optional) The name of the branch to commit to, or null for main line. Default is null.
     * @param baseRevision (Optional) The base revision for this commit, or -1 for HEAD. Default is -1.
     * @returns a Promise of a Team Server Revision corresponding to the given workingCopy.
     */
    commitToTeamServer(workingCopy: OnlineWorkingCopy, branchName?: string | null, baseRevision?: number): When.Promise<Revision>;
    private _awaitJobResult;
    private _createRequestContent;
    private _compilePayload;
    private _parseResult;
    private _parseJobStatus;
    private _parseJobResult;
    private _parseAndQuery;
    private _createHttpErrorCodeInterceptor;
}
/**
 * Representation of a Mendix App Project
 */
export declare class Project {
    private _client;
    private _id;
    private _name;
    /**
     * @param client a MendixSdkClient instance
     * @param id Project id returned by the Mendix Projects API
     * @param name The desired project name
     */
    constructor(client: MendixSdkClient, id: string, name: string);
    /**
     * @returns ID of this Project
     */
    id(): string;
    /**
     * @returns name of this Project
     */
    name(): string;
    /**
     * Create a new Online Working Copy for the given project based on a given revision.
     *
     * @param revision The team server revision number.
     * @returns A Promise of a WorkingCopy instance that represents your new Online Working Copy.
     */
    createWorkingCopy(revision?: Revision): When.Promise<OnlineWorkingCopy>;
}
/**
 * An Online Working Copy, which contains a snapshot of your Mendix App model.
 */
export declare class OnlineWorkingCopy {
    private _client;
    private _id;
    private _sourceRevision;
    private _model;
    constructor(client: MendixSdkClient, id: string, sourceRevision: Revision, store: IModel);
    /**
     * @returns ID of this Online Working Copy
     */
    id(): string;
    /**
     * @returns Revision (which contains the team server source branch) of this Online Working Copy
     */
    sourceRevision(): Revision;
    /**
     * @returns The project of which this Online Working Copy contains a model snapshot.
     */
    project(): Project;
    /**
     * @returns The model stored in this Online Working Copy
     */
    model(): IModel;
    /**
     * Commit changes in this Online Working Copy to the Team Server.
     * IMPORTANT: After committing, the connection to the Model Server is closed.
     * This means that you cannot commit any changes you make to the working copy after first committing.
     * If you want to make any further changes, create a new working copy by calling createWorkingCopy()
     * on the returned revision.
     *
     * @param branchName (Optional) the branch to commit to. Use null for main line.
     * @param baseRevision (Optional) the base revision of this commit.
     * @returns a Promise of a Team Server Revision
     */
    commit(branchName?: string | null, baseRevision?: number): When.Promise<Revision>;
}
/**
 * Team Server Revision
 */
export declare class Revision {
    private _num;
    private _branch;
    constructor(num: number, branch: Branch);
    num(): number;
    branch(): Branch;
    createWorkingCopy(): When.Promise<OnlineWorkingCopy>;
}
/**
 * Team Server branch line
 */
export declare class Branch {
    private _project;
    private _name;
    constructor(project: Project, name: string | null);
    project(): Project;
    name(): string | null;
}
/**
 * Logs a message to the console with a timestamp and an arbitrary number of parameters.
 * @param message The message to be logged
 * @param optionalParams Zero or more parameters to be added to the log message.
 */
export declare function myLog(message: string, ...optionalParams: any[]): void;
/**
 * Any model unit or that extends IAbstractElement has a load() method.
 * Use this interface to pass loadable model units to loadAsPromise().
 */
export declare type Loadable<T> = {
    load(callback: (result: T) => void): void;
} | {
    load(callback: (result: T) => void): void;
    load(): Promise<T>;
};
/**
 * Any model unit or that extends IAbstractElement has a load() method.
 * This function is a convenience function that allows you load a model unit and return a Promise,
 * instead of having to provide a callback method.
 * @param loadable Any model unit that implements a load() method.
 * @returns a Promise of an object that is of the same type as the loadable parameter.
 */
export declare function loadAsPromise<T>(loadable: Loadable<T>): When.Promise<T>;
export interface SdkOptions {
    /**
     * @property Used for running tests with mocks.
     */
    pollDelay?: number;
}
