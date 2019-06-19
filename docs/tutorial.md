---
permalink: /tutorial/
---

# Tutorial

> This tutorial serves as the required tutorial document for the [Business Process Management 2019](https://bpm2019.ai.wu.ac.at/) demo paper submission.
> It is based on **version 0.2.4** of `chor-js`, and certain features and interface elements might have changed in the meantime.

### Setup

Setup `chor-js-demo` according to our [usage instructions](https://github.com/bptlab/chor-js-demo).

__We recommend using the live version deployed at__  
__<https://bpt-lab.org/chor-js-demo/>!__

### Summary

In this tutorial, we will show a simple use-case that might pop up when working with choreography diagrams.
Imagine there is a repository with choreography diagrams that you are using in your production environment.
There are problems when executing one diagram, and you are tasked to investigate:

1. You open the diagram using `chor-js`.
1. You inspect the model using the validator.
1. You notice an error in the diagram, and use `chor-js` to fix it.
1. You save the fixed diagram and replace the faulty one.

## __Step 1:__ Opening the diagram

[*The diagram used in this example can be found here.*]({{ "/docs/assets/resources/tutorial-faulty-diagram.bpmn" | relative_url }})

Once you have acquired the faulty diagram, you can open it up in `chor-js`.
For this, you just use the *Select BPMN XML file* button in the lower left corner of the screen.

<img src="{{ "/docs/assets/img/tutorial/step-1-open.png" | relative_url }}" alt="Opening the diagram" />

Navigate to your file and open it.
The diagram will be loaded and displayed immediately, resulting in the following render:

<img class="shadow" src="{{ "/docs/assets/img/tutorial/step-1-faulty-diagram.svg" | relative_url }}" alt="Invalid diagram" />
[(large version)]({{ "/docs/assets/img/tutorial/step-1-faulty-diagram.svg" | relative_url }})

The diagram models the interactions between a landlord and a tenant regarding bond payments at the end of a tenancy.
The landlord may either file a claim for the bond, e.g., in case of damage to property, or release the bond back to the tenant.
In the former case, the tenant may dispute this claim, or the bond gets transferred to the landlord.
[Rental Bonds Online (RBO)](https://www.fairtrading.nsw.gov.au/housing-and-property/renting/rental-bonds-online), a government service in the state of New South Wales, Australia, serves as a escrow agent and mediator in the whole choreography.

Apparently, this diagram exhibits problems when executing it.
On a first glance, it might not be obvious where the error originates from.
To make your life easier, you can check whether the validator function might be of any help.

## __Step 2:__ Finding the error

Activate the validator function by clicking the button in the lower left corner of the screen.

<img src="{{ "/docs/assets/img/tutorial/step-2-validator.png" | relative_url }}" alt="Activate the validator" />

This will immediately check the diagram for a number of errors and constraints defined in the OMG BPMN 2.0 standard which might be helpful in solving your problem.
In this case, the validator reports an error on the second event-based gateway:

<img class="shadow" src="{{ "/docs/assets/img/tutorial/step-2-find-error.png" | relative_url }}" alt="Using the validator to find the error" />

The error message reads:

> After an event-based gateway, all senders or receivers must be the same.

This general rule applies to all event-based gateways in choreography diagrams:
For the gateway to be locally enforceable, one participant needs to be involved in all the tasks related to it, either as a sender or as a receiver.
In our example, this is not the case.
Neither senders nor receivers are the same participant, rendering the diagram unenforceable.

From a more concrete point of view, the problem can de described as follows:
The tenant does not have the chance to accept the claim on their terms, and is instead sent into a race condition with RBO.
If RBO is first to transfer the rent to the landlord, the tenant may not file a dispute anymore.
Luckily, this error was caught by the event-based gateway constraint.

## __Step 3:__ Fixing the error

The error can be fixed in multiple ways.
From a contextual point of view, it makes sense to remove the race condition between the tenant and RBO and let the tenant proactively make the choice to accept the bond claim.
For that, we have to insert an additional choreography task.
The necessary steps are illustrated in the following animation:

<img class="shadow" src="{{ "/docs/assets/img/tutorial/step-3-fixing.gif" | relative_url }}" alt="Fixing the error in the modeler" />

In short, we select the sequence flow between 'notify tenant of claim' and 'transfer bond to landlord' and remove it.
We then select the latter task as well as the end event and move them to the right to make space for the new choreography task.
Note that the snapping guides can be used to nicely align the elements to each other.
We then use the context menu from the event-based gateway to create a new task, which we configure to model the acceptance of the claim by the tenant towards RBO.
Lastly, we connect the two tasks with a sequence flow and are done.

The fixed diagram then looks like this:

<img class="shadow" src="{{ "/docs/assets/img/tutorial/step-3-fixed-diagram.svg" | relative_url }}" alt="Fixed diagram" />
[(large version)]({{ "/docs/assets/img/tutorial/step-3-fixed-diagram.svg" | relative_url }})

Cross-checking with the validator confirms: This diagram does not exhibit any errors or constraint violations anymore!

## __Step 4:__ Saving the diagram

As a last step, you want to replace the faulty diagram with the fixed version you have created.
To this end, you can use the *Download BPMN XMI file* button in the lower left corner of the screen.

<img src="{{ "/docs/assets/img/tutorial/step-4-save.png" | relative_url }}" alt="Saving the diagram" />

Save the diagram wherever you like, and enjoy!

[*The fixed diagram can be found here.*]({{ "/docs/assets/resources/tutorial-fixed-diagram.bpmn" | relative_url }})