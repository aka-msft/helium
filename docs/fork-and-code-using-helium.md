# Instructions to fork and code using this repo

## Overview
If you are starting to write a Node.JS API server, the below steps will help you fork this repo and easily get started on your app while incorporating best practices. 
The instructions below detail the changes you would need to make for your app after forking the code.

## Before you start
This repo uses
- [Cosmos DB](https://azure.microsoft.com/en-us/services/cosmos-db/) for the database component
- [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) for telemetry 
- [Bunyan Logger](https://github.com/trentm/node-bunyan) for tracing.

You can continue to use these or replace them with a provider of your choice.

## Prerequisites
The instructions here do not cover the steps to follow to import data into your database. The assumption is that you will have decided the schema for the data and added records to the database. 

You can refer to https://github.com/4-co/imdb for details on the example data we used and instructions to import them to CosmosDB. 

## Step-by-Step instructions
1. Fork this repo by navigating to https://github.com/microsoft/helium and clicking on the "Fork" button on the top right.

![image](imgs/forkrepo.PNG)

Once forked, clone the forked repo onto your computer using the `git clone` command.

2. Model the entities your API will expose by creating classes in `/src/app/models`. For examples, see the Movie, Actor, and Genre models created for the reference app [here](/src/app/models).

3. Navigate to the `src/app/models` folder and add a separate `.ts` file for each entity in your app. 

Update the swagger comment and the class based on your model.

Add the decorators to enforce what kind of validation you need for each field like below.
```
export class Actor implements IValidatable {

    @IsNotEmpty()
    @IsAlphanumeric()
    public id: string;
```

4. Define what operations you would like to perform on the entities. For example, in our case, we perfom "GET all", "GET by Id" and "POST" operations on the "Actor" entity. 

5. Navigate to the `src/app/controllers` folder and add a separate `.ts` file for each entity which will define all the operations for that entity. You can copy over the code from one of the files under the controllers folder to this file and update it.

6. Update the @Controller decorator for the class with the API path of your endpoint

```
@Controller("/api/actors")
```
Update the @swagger comment based on your API operation.

Update the decorator above each function based on what operation and path it implements.
```
@Get("/")
public async getAll(req: Request, res) {
```
Implement your function to call the appropriate database functions.

7. Leave the `system.ts` file as we recommend implementing a health check endpoint in your app. 
You can make changes to the actual implementation of the function based on the database provider you use.

8. Navigate to the `src/app/tests` folder and add one `.ts` file for each controller. Write the integration tests modelled on what is in our sample.

9. Remove the files from our sample that don't apply to your app from `src/app/models`, `src/app/controllers` and `src/app/tests` folders.

10. The next step is to update the `src/app/server.ts` file. 
Bind the controllers that you have implemented to the Inversion of Control Container.
```
iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(MovieController).whenTargetNamed("MovieController");
iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(SystemController).whenTargetNamed("SystemController");
```
If you don't use the default providers for database, telemetry and logging, you will need to bind those controllers appropriately too. 

11. After this you can follow the steps in [deploying-helium] (deploying-helium.md) to build and test the app.
