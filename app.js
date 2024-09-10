const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {format, isValid, parseISO} = require('date-fns')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const startServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
  }
}

startServerAndDb()

//dateFormat
const dateFormat = stringDate => {
  return format(new Date(stringDate), 'yyyy-MM-dd')
}

//invalid scenarios
const parametersCheck = parameters => {
  const querysKeyLists = Object.keys(parameters)
  const invalidKeys = []
  for (let key of querysKeyLists) {
    if (key === 'status') {
      if (
        parameters.status === 'TO DO' ||
        parameters.status === 'IN PROGRESS' ||
        parameters.status === 'DONE'
      ) {
        parameters.status = parameters.status
      } else {
        invalidKeys.push('Status')
        return 'Invalid Todo Status'
      }
    }
    if (key === 'priority') {
      if (
        parameters.priority === 'HIGH' ||
        parameters.priority === 'MEDIUM' ||
        parameters.priority === 'LOW'
      ) {
        parameters.priority = parameters.priority
      } else {
        invalidKeys.push('Priority')
        return 'Invalid Todo Priority'
      }
    }
    if (key === 'category') {
      if (
        parameters.category === 'WORK' ||
        parameters.category === 'LEARNING' ||
        parameters.category === 'HOME'
      ) {
        parameters.category = parameters.category
      } else {
        invalidKeys.push('Category')
        return 'Invalid Todo Category'
      }
    }
    if (key === 'date') {
      const validdate = isValid(parseISO(dateFormat(parameters.date)))
      if (validdate === true) {
        parameters.date = parameters.date
      } else {
        invalidKeys.push('Due Date')
        return 'Invalid Due Date'
      }
    }
  }
  if (invalidKeys.length === 0) {
    return true
  }
}

//API1
app.get('/todos/', async (request, response) => {
  const snakeToCamel = each => {
    return {
      id: each.id,
      todo: each.todo,
      priority: each.priority,
      status: each.status,
      category: each.category,
      dueDate: each.due_date,
    }
  }
  const queryParametersLength = Object.keys(request.query).length
  if (queryParametersLength === 0) {
    const getTodosQuery = `
    select * from todo
    `
    const dbResponse = await db.all(getTodosQuery)
    response.send(dbResponse.map(each => snakeToCamel(each)))
  } else {
    const isValidParameters = parametersCheck(request.query)
    console.log(isValidParameters)
    if (isValidParameters === true) {
      const {
        status = '',
        priority = '',
        search_q = '',
        category = '',
      } = request.query
      const getTodosQuery = `
        select * from todo
        where status like '%${status}%' and priority like '%${priority}%' and todo like '%${search_q}%' and category like '%${category}%' 
        `
      const dbResponse = await db.all(getTodosQuery)
      response.send(dbResponse.map(each => snakeToCamel(each)))
    } else {
      response.status(400)
      response.send(isValidParameters)
    }
  }
})

//API2
app.get('/todos/:todoId/', async (request, response) => {
  const snakeToCamel = each => {
    return {
      id: each.id,
      todo: each.todo,
      priority: each.priority,
      status: each.status,
      category: each.category,
      dueDate: each.due_date,
    }
  }
  const {todoId} = request.params
  const getQuery = `
    select * from todo
    where id=${todoId};
    `
  const dbResponse = await db.get(getQuery)
  response.send(snakeToCamel(dbResponse))
})

//API3 agenda
app.get('/agenda/', async (request, response) => {
  const snakeToCamel = each => {
    return {
      id: each.id,
      todo: each.todo,
      priority: each.priority,
      status: each.status,
      category: each.category,
      dueDate: each.due_date,
    }
  }

  const queryParametersLength = Object.keys(request.query).length
  if (queryParametersLength === 0) {
    const getQuery = `
      select * from todo
      `
    const dbResponse = await db.all(getQuery)
    response.send(dbResponse.map(each => snakeToCamel(each)))
  } else {
    const isValidParameters = parametersCheck(request.query)
    if (isValidParameters === true) {
      const {date} = request.query
      const correctDate = dateFormat(date)
      const getQuery = `
          select * from todo
          where due_date='${correctDate}';
          `
      const dbResponse = await db.all(getQuery)
      response.send(dbResponse.map(each => snakeToCamel(each)))
    } else {
      response.status(400)
      response.send(isValidParameters)
    }
  }
})

//API4
app.post('/todos/', async (request, response) => {
  const queryParametersLength = Object.keys(request.body).length
  if (queryParametersLength === 0) {
    const getTodosQuery = `
    select * from todo
    `
    const dbResponse = await db.all(getTodosQuery)
    response.send(dbResponse.map(each => snakeToCamel(each)))
  } else {
    const isValidParameters = parametersCheck(request.body)
    console.log(isValidParameters)
    if (isValidParameters === true) {
      const {id, todo, priority, status, category, dueDate} = request.body
      const postQuery = `
          insert into todo(id,todo,priority,status,category,due_date)
          values(
            ${id},'${todo}','${priority}','${status}','${category}','${dueDate}'
          )
          `
      await db.run(postQuery)
      response.send('Todo Successfully Added')
    } else {
      response.status(400)
      response.send(isValidParameters)
    }
  }
})

//API5
app.put('/todos/:todoId/', async (request, response) => {
  const queryParametersLength = Object.keys(request.body).length
  if (queryParametersLength === 0) {
    const getTodosQuery = `
    select * from todo
    `
    const dbResponse = await db.all(getTodosQuery)
    response.send(dbResponse.map(each => snakeToCamel(each)))
  } else {
    const isValidParameters = parametersCheck(request.body)
    console.log(isValidParameters)
    if (isValidParameters === true) {
      const getPreviousTodo = `
      select * from todo`
      const previousTodo = await db.get(getPreviousTodo)
      const {
        todo = previousTodo.todo,
        status = previousTodo.status,
        priority = previousTodo.priority,
        category = previousTodo.category,
        dueDate = previousTodo.dueDate,
      } = request.body

      const {todoId} = request.params
      const putQuery = `
        update todo
        set
          id=${todoId},todo ='${todo}' ,priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
        where id = ${todoId};
        `
      await db.run(putQuery)
      console.log(Object.keys(request.body)[0])
      if (Object.keys(request.body)[0] === 'status') {
        response.send('Status Updated')
      } else if (Object.keys(request.body)[0] === 'priority') {
        response.send('Priority Updated')
      } else if (Object.keys(request.body)[0] === 'category') {
        response.send('Category Updated')
      } else if (Object.keys(request.body)[0] === 'dueDate') {
        response.send('Due Date Updated')
      } else {
        response.send('Todo Updated')
      }
    } else {
      response.status(400)
      response.send(isValidParameters)
      //**
    }
  }
})

//API6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    delete from todo
    where id = ${todoId};
    `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
