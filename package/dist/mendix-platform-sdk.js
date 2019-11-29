"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("@gajduk/mendixmodelsdk");
const fs = require("fs");
const os = require("os");
const path = require("path");
const when_1 = require("when");
const lodash_1 = require("lodash");
const interceptor = require("rest/interceptor");
const pathPrefix = require("rest/interceptor/pathPrefix");
const xml2js = require("xml2js");
const jsonpath = require("jsonpath");
const rest_1 = require("rest");
/**
 * The state of the background job:
 *
 * - Running: the job has been submitted for execution
 * - Completed: the job has been successfully completed
 * - Failed: the job has finished with an error
 */
var JobState;
(function (JobState) {
    JobState[JobState["Running"] = 0] = "Running";
    JobState[JobState["Completed"] = 1] = "Completed";
    JobState[JobState["Failed"] = 2] = "Failed";
})(JobState = exports.JobState || (exports.JobState = {}));
/**
 * Client class that provides access to all Platform and Model APIs.
 */
class MendixSdkClient {
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
    constructor(username, apikey, password, openid, projectsApiEndpoint, modelServerEndpoint, options) {
        let credentials;
        if (username && apikey) {
            credentials = {
                username: username,
                apikey: apikey
            };
        }
        else if (username && password && openid) {
            credentials = {
                username: username,
                password: password,
                openid: openid
            };
        }
        else {
            throw new Error("Incomplete credentials. Please pass username and apikey, or pass username, password and openid.");
        }
        const connectionConfig = {
            credentials: credentials
        };
        if (!lodash_1.isEmpty(modelServerEndpoint)) {
            connectionConfig["endPoint"] = modelServerEndpoint;
        }
        this._modelSdkClient = mendixmodelsdk_1.Model.createSdkClient(connectionConfig);
        this._platformSdkClient = new PlatformSdkClient(this, username, apikey, projectsApiEndpoint ? projectsApiEndpoint : MendixSdkClient.DEFAULT_PROJECTSAPI_ENDPOINT);
        this._options = options ? options : { pollDelay: MendixSdkClient.DEFAULT_POLL_DELAY };
    }
    platform() {
        return this._platformSdkClient;
    }
    model() {
        return this._modelSdkClient;
    }
    options() {
        return this._options;
    }
}
MendixSdkClient.DEFAULT_PROJECTSAPI_ENDPOINT = "https://sprintr.home.mendix.com";
MendixSdkClient.DEFAULT_POLL_DELAY = 1000;
exports.MendixSdkClient = MendixSdkClient;
// Internal (similar to the Model API 'SdkClient')
class PlatformSdkClient {
    constructor(client, username, apikey, projectsApiEndpoint) {
        this._client = client;
        this._username = username;
        this._apikey = apikey;
        this._xmlParser = new xml2js.Parser();
        this._projectsApiEndpoint = projectsApiEndpoint;
    }
    static _templatePath(filename) {
        return path.join(__dirname, "templates", filename);
    }
    /**
     * Creates a new app and commits it to the Team Server.
     *
     * @param projectName The name of the new app
     * @param projectSummary (Optional) A short description of the new app
     * @returns a Promise of a Mendix App Project
     */
    createNewApp(projectName, projectSummary, templateUUID) {
        console.log(`Creating new project with name ${projectName} for user ${this._username}...`);
        const contents = this._createRequestContent(PlatformSdkClient.createNewAppXml, {
            ProjectName: projectName,
            ProjectSummary: projectSummary,
            User: this._username,
            ApiKey: this._apikey,
            TemplateUUID: templateUUID
        });
        const apiClient = rest_1.wrap(this._createHttpErrorCodeInterceptor("Failed to create new app"))
            .wrap(this._parseResult())
            .wrap(pathPrefix, { prefix: this._projectsApiEndpoint });
        return apiClient(contents)
            .then(response => {
            const jobId = response.entity;
            console.log(`Project creation for user ${this._username} underway with job id: ${jobId}...`);
            return this._awaitJobResult(jobId);
        })
            .then(jobResult => {
            console.log(`Project created successfully for user ${this._username} with id ${jobResult.result}`);
            return new Project(this._client, jobResult.result, projectName);
        });
    }
    /**
     * Deletes an application, including all resources that are associated with it, like the Team Server repository, cloud nodes,
     * and all model server working copies. The operation can only be called by someone who has administrative permissions on the
     * project (usually the user that created the project).
     *
     * @param appId The App ID of the app in the Platform Portal.
     * @returns a Promise of void
     */
    deleteApp(appId) {
        console.log(`Deleting app with app ID '${appId}'...`);
        const contents = this._createRequestContent(PlatformSdkClient.deleteAppXml, {
            User: this._username,
            ApiKey: this._apikey,
            ProjectID: appId
        });
        const apiClient = rest_1.wrap(this._createHttpErrorCodeInterceptor("Failed to delete app")).wrap(pathPrefix, {
            prefix: this._projectsApiEndpoint
        });
        return apiClient(contents).then(response => {
            // Nothing to do here
        });
    }
    /**
     * Expose a specific Team Server revision as an Online Working Copy.
     *
     * @param project an instance of a Mendix App Project
     * @param revision A Revision instance pointing to a revision number on a specific Team Server branch
     * @returns a Promise of an OnlineWorkingCopy in the Mendix Model Server corresponding to the given project and revision.
     */
    createOnlineWorkingCopy(project, revision) {
        console.log(`Creating new online working copy for project ${project.id()} : ${project.name()}`);
        const request = this._createRequestContent(PlatformSdkClient.createOnlineWorkingCopyXml, {
            Username: this._username,
            ApiKey: this._apikey,
            ProjectId: project.id(),
            Branch: revision ? revision.branch().name() : null,
            Revision: revision ? revision.num() : null
        });
        const apiClient = rest_1.wrap(this._createHttpErrorCodeInterceptor("Failed to create online working copy"))
            .wrap(this._parseResult())
            .wrap(pathPrefix, { prefix: this._projectsApiEndpoint });
        return apiClient(request)
            .then(response => {
            const jobId = response.entity;
            return this._awaitJobResult(jobId);
        })
            .then(jobResult => {
            const wcId = jobResult.result;
            console.log(`Successfully created new online working copy ${wcId} for project ${project.id()} : ${project.name()}`);
            return when_1.promise((resolve, reject) => {
                this._client.model().openWorkingCopy(wcId, (model) => {
                    console.log(`Successfully opened new online working copy ${wcId} for project ${project.id()} : ${project.name()}`);
                    const rev = revision ? revision : new Revision(-1, new Branch(project, null));
                    const workingCopy = new OnlineWorkingCopy(this._client, wcId, rev, model);
                    resolve(workingCopy);
                }, error => {
                    console.error(`Failed to open new online working copy ${wcId} for project ${project.id()}: ${project.name()}:`);
                    reject(error);
                });
            });
        });
    }
    /**
     * Commit changes in your Online Working Copy to your model back to the Team Server.
     *
     * @param workingCopy an OnlineWorkingCopy instance pointing to a working copy on the Mendix Model server.
     * @param branchName (Optional) The name of the branch to commit to, or null for main line. Default is null.
     * @param baseRevision (Optional) The base revision for this commit, or -1 for HEAD. Default is -1.
     * @returns a Promise of a Team Server Revision corresponding to the given workingCopy.
     */
    commitToTeamServer(workingCopy, branchName = null, baseRevision = -1) {
        if (workingCopy === null || workingCopy.project() === null) {
            return when_1.reject("Working copy is empty or does not contain referral to project");
        }
        else if (baseRevision < -1) {
            return when_1.reject(`Invalid base revision ${baseRevision}`);
        }
        const teamServerInfo = `team server project ${workingCopy.project().id()} branch ${branchName} base revision ${baseRevision}`;
        console.log(`Committing changes in online working copy ${workingCopy.id()} to ${teamServerInfo}`);
        const request = this._createRequestContent(PlatformSdkClient.commitWorkingCopyChangesXml, {
            Username: this._username,
            ApiKey: this._apikey,
            WorkingCopyId: workingCopy.id(),
            ProjectId: workingCopy.project().id(),
            Branch: branchName,
            Revision: baseRevision
        });
        const apiClient = rest_1.wrap(this._createHttpErrorCodeInterceptor("Failed to commit to team server"))
            .wrap(this._parseResult())
            .wrap(pathPrefix, { prefix: this._projectsApiEndpoint });
        return apiClient(request)
            .then(response => {
            const jobId = response.entity;
            return this._awaitJobResult(jobId);
        })
            .then(jobResult => {
            return when_1.promise((resolve, reject) => {
                const num = parseInt(jobResult.result, 10);
                if (num === null) {
                    reject(`Failed to commit changes to team server: revision ${num} on branch ${branchName}. Reason: returned job id is not a number.`);
                }
                else {
                    console.log(`Successfully committed changes to team server: revision ${num} on branch ${branchName}`);
                    const branch = new Branch(workingCopy.project(), branchName);
                    const revision = new Revision(num, branch);
                    resolve(revision);
                }
            });
        });
    }
    _awaitJobResult(jobId) {
        return when_1.promise((resolve, reject) => {
            setTimeout(() => {
                const request = this._createRequestContent(PlatformSdkClient.retrieveJobStatusXml, { JobId: jobId });
                const client = rest_1.wrap(this._createHttpErrorCodeInterceptor("Error when retrieving job status"))
                    .wrap(this._parseJobStatus())
                    .wrap(pathPrefix, { prefix: this._projectsApiEndpoint });
                client(request).then(response => {
                    const state = response.entity.state;
                    if (state === JobState[JobState.Completed]) {
                        resolve(response.entity);
                    }
                    else if (state === JobState[JobState.Failed]) {
                        reject(response.entity.errorMessage);
                    }
                    else {
                        // JobState.Running
                        this._awaitJobResult(jobId).done(resolve, reject);
                    }
                }, reject);
            }, this._client.options().pollDelay);
        });
    }
    _createRequestContent(templateText, data) {
        const payload = this._compilePayload(templateText, data);
        return {
            path: PlatformSdkClient.PROJECTS_API_PATH,
            method: "POST",
            headers: {
                "Content-Type": "text/xml;charset=UTF-8"
            },
            mixin: {},
            entity: payload
        };
    }
    _compilePayload(templateName, data) {
        const xmlPayloadTemplate = fs.readFileSync(templateName, "utf8");
        const compileXmlPayload = lodash_1.template(xmlPayloadTemplate);
        return compileXmlPayload(data);
    }
    _parseResult() {
        return interceptor({
            success: response => {
                if (lodash_1.isEmpty(response.entity)) {
                    return when_1.reject("Error: HTTP response entity missing");
                }
                else {
                    return this._parseAndQuery(response.entity, "$..Result[0]").then(result => {
                        response.entity = result;
                        return response;
                    });
                }
            }
        });
    }
    _parseJobStatus() {
        return interceptor({
            success: response => {
                if (lodash_1.isEmpty(response.entity)) {
                    return when_1.reject("Error: HTTP response entity missing");
                }
                else {
                    return when_1.promise((resolve, reject) => {
                        xml2js.parseString(response.entity, (error, parsed) => {
                            if (error) {
                                console.error(`Something went wrong: ${error}`);
                                reject(error);
                            }
                            else {
                                response.entity = this._parseJobResult(parsed);
                                resolve(response);
                            }
                        });
                    });
                }
            }
        });
    }
    _parseJobResult(parsed) {
        const jobId = jsonpath.query(parsed, "$..JobId[0]")[0];
        const startTime = jsonpath.query(parsed, "$..StartTime[0]")[0];
        const endTime = jsonpath.query(parsed, "$..EndTime[0]")[0];
        const state = jsonpath.query(parsed, "$..State[0]")[0];
        const result = jsonpath.query(parsed, "$..Result[0]")[0];
        const errorMessage = jsonpath.query(parsed, "$..ErrorMessage[0]")[0];
        return {
            jobId: jobId,
            startTime: startTime,
            endTime: endTime,
            state: state,
            result: result,
            errorMessage: errorMessage
        };
    }
    _parseAndQuery(xml, query) {
        this._xmlParser.reset();
        return when_1.promise((resolve, reject) => {
            this._xmlParser.parseString(xml, (err, result) => {
                if (err) {
                    const error = new Error(err);
                    reject(error);
                }
                else {
                    const parseResult = jsonpath.query(result, query)[0];
                    if (lodash_1.isEmpty(parseResult)) {
                        const error = new Error(`Query ${query} on ${parseResult} does not give any result`);
                        reject(error);
                    }
                    else {
                        resolve(parseResult);
                    }
                }
            });
        });
    }
    _createHttpErrorCodeInterceptor(errorMessage) {
        const responseAction = (response) => {
            return when_1.promise((resolve, reject) => {
                if (lodash_1.isEmpty(response.status) || lodash_1.isEmpty(response.entity)) {
                    reject(`Unexpected HTTP response code: ${response.status.code} ${response.raw.response.statusMessage}.`);
                }
                else if (response.status.code === PlatformSdkClient.HTTP_STATUS_OK_RESPONSE_CODE) {
                    resolve(response);
                }
                else if (response.status.code === PlatformSdkClient.HTTP_STATUS_WS_ERROR_RESPONSE_CODE) {
                    this._parseAndQuery(response.entity, "$..faultstring[0]").done(cause => reject(`${errorMessage}: ${cause.replace(/\\[\r\n]+/g, os.EOL)}`), reject);
                }
                else {
                    const retryMessage = "Please retry after a few minutes. If the problem persists, please consult https://mxforum.mendix.com";
                    reject(`Unexpected HTTP response code: ${response.status.code} ${response.raw.response.statusMessage}. ${retryMessage}`);
                }
            });
        };
        return interceptor({
            response: responseAction
        });
    }
}
PlatformSdkClient.PROJECTS_API_PATH = "/ws/ProjectsAPI/11/soap1";
PlatformSdkClient.HTTP_STATUS_OK_RESPONSE_CODE = 200;
PlatformSdkClient.HTTP_STATUS_WS_ERROR_RESPONSE_CODE = 500;
PlatformSdkClient.createNewAppXml = PlatformSdkClient._templatePath("CreateNewApp.xml");
PlatformSdkClient.deleteAppXml = PlatformSdkClient._templatePath("DeleteApp.xml");
PlatformSdkClient.createOnlineWorkingCopyXml = PlatformSdkClient._templatePath("CreateOnlineWorkingCopy.xml");
PlatformSdkClient.commitWorkingCopyChangesXml = PlatformSdkClient._templatePath("CommitWorkingCopyChanges.xml");
PlatformSdkClient.retrieveJobStatusXml = PlatformSdkClient._templatePath("RetrieveJobStatus.xml");
exports.PlatformSdkClient = PlatformSdkClient;
/**
 * Representation of a Mendix App Project
 */
class Project {
    /**
     * @param client a MendixSdkClient instance
     * @param id Project id returned by the Mendix Projects API
     * @param name The desired project name
     */
    constructor(client, id, name) {
        this._client = client;
        this._id = id;
        this._name = name;
    }
    /**
     * @returns ID of this Project
     */
    id() {
        return this._id;
    }
    /**
     * @returns name of this Project
     */
    name() {
        return this._name;
    }
    /**
     * Create a new Online Working Copy for the given project based on a given revision.
     *
     * @param revision The team server revision number.
     * @returns A Promise of a WorkingCopy instance that represents your new Online Working Copy.
     */
    createWorkingCopy(revision) {
        return this._client.platform().createOnlineWorkingCopy(this, revision);
    }
}
exports.Project = Project;
/**
 * An Online Working Copy, which contains a snapshot of your Mendix App model.
 */
class OnlineWorkingCopy {
    constructor(client, id, sourceRevision, store) {
        this._client = client;
        this._id = id;
        this._sourceRevision = sourceRevision;
        this._model = store;
    }
    /**
     * @returns ID of this Online Working Copy
     */
    id() {
        return this._id;
    }
    /**
     * @returns Revision (which contains the team server source branch) of this Online Working Copy
     */
    sourceRevision() {
        return this._sourceRevision;
    }
    /**
     * @returns The project of which this Online Working Copy contains a model snapshot.
     */
    project() {
        return this._sourceRevision.branch().project();
    }
    /**
     * @returns The model stored in this Online Working Copy
     */
    model() {
        return this._model;
    }
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
    commit(branchName, baseRevision) {
        return when_1.promise((resolve, reject) => {
            console.log("Closing connection to Model API...");
            this._model.closeConnection(() => {
                console.log("Closed connection to Model API successfully.");
                resolve(undefined);
            }, reject);
        }).then(() => {
            return this._client.platform().commitToTeamServer(this, branchName, baseRevision);
        });
    }
}
exports.OnlineWorkingCopy = OnlineWorkingCopy;
/**
 * Team Server Revision
 */
class Revision {
    // TODO: branch should be optional, in which case mainline is used
    constructor(num, branch) {
        this._num = num;
        this._branch = branch;
    }
    num() {
        return this._num;
    }
    branch() {
        return this._branch;
    }
    createWorkingCopy() {
        return this._branch.project().createWorkingCopy(this);
    }
}
exports.Revision = Revision;
/**
 * Team Server branch line
 */
class Branch {
    constructor(project, name) {
        this._project = project;
        this._name = name;
    }
    project() {
        return this._project;
    }
    name() {
        return this._name;
    }
}
exports.Branch = Branch;
/*
 *
 * UTILITIES
 *
 */
/**
 * Logs a message to the console with a timestamp and an arbitrary number of parameters.
 * @param message The message to be logged
 * @param optionalParams Zero or more parameters to be added to the log message.
 */
function myLog(message, ...optionalParams) {
    console.log(`${Date.now()}: ${message} ${optionalParams}`);
}
exports.myLog = myLog;
/**
 * Any model unit or that extends IAbstractElement has a load() method.
 * This function is a convenience function that allows you load a model unit and return a Promise,
 * instead of having to provide a callback method.
 * @param loadable Any model unit that implements a load() method.
 * @returns a Promise of an object that is of the same type as the loadable parameter.
 */
function loadAsPromise(loadable) {
    return when_1.promise((resolve, reject) => loadable.load(resolve));
}
exports.loadAsPromise = loadAsPromise;
//# sourceMappingURL=mendix-platform-sdk.js.map