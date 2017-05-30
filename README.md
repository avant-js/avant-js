# AvantJS

A visual tool for bootstrapping NodeJS applications, based on [Node-RED](http://nodered.org/).

![AvantJS flows](https://github.com/avant-js/docs/raw/master/screenshots/sample-flow.PNG)

## Quick Start

1. `npm install -g avant-js`
2. `avant-js`
3. Open <http://localhost:1880>
4. To generate the code click on Generate button in the top toolbar. A new folder `generatedcode` will be created inside current folder with your app code.

## Developers

If you want to run the latest code from git, here's how to get started:

1. Clone the code:

        git clone https://github.com/avant-js/avant-js.git
        cd avant-js

2. Install the avant-js dependencies

        npm install

3. Build the code

        npm run build

4. Run

        npm start
   or

        node red.js
       
5. The server will be running on `http://localhost:1880`

6. To generate the code click on Generte button in the top toolbar. The code will be saved to the `generatedcode` folder inside AvantJS folder

## Authors

AvantJS is a project created by Matheus Webler [@mwebler](http://github.com/mwebler) for the thesis in Computer Science.

Node-RED is a project of the [JS Foundation](http://js.foundation).
It was created by [IBM Emerging Technology](https://www.ibm.com/blogs/emerging-technology/).

* Nick O'Leary [@knolleary](http://twitter.com/knolleary)
* Dave Conway-Jones [@ceejay](http://twitter.com/ceejay)


## Copyright and license

Node-RED is under Copyright of JS Foundation and other contributors, http://js.foundation under [the Apache 2.0 license](LICENSE).

Modified and highlited parts for AvantJS project are copyright under [the Apache 2.0 license](LICENSE).
