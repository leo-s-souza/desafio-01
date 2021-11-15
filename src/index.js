const express = require('express');
const cors = require('cors');

const {v4: uuidv4} = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

/**
 *
 * @param request
 * @param response
 * @param next
 * @returns {*}
 */
function checksExistsUserAccount(request, response, next) {
  const user = getUserByUserName(request.headers.username);

  if (!user) {
    return response.status(404).send({error: "User not found!"});
  }

  request.user = user;

  return next();
}

/**
 * Procura e retorna o usuário da lista se o mesmo existir.
 *
 * @param username - string com o nome
 * @returns {*}
 */
function getUserByUserName(username) {
  return users.find((user) => user.username === username);
}

function getUserTodoById(response, todos, id) {
  if (!todos) {
    return response.status(404).send({error: "There are no todos for this user!"});
  }

  const todo = todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).send({error: "There is no todo with this id!"});
  }

  return todo;
}

app.post('/users', (request, response) => {
  const {name, username} = request.body,
    userExists = getUserByUserName(username);

  if (userExists) {
    return response.status(400).send({error: "User alredy exists!"});
  }

  const newUser = {
    id: uuidv4(),
    name: name,
    username: username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).send(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.status(201).send(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body,
    user = request.user,
    todo = {
      id: uuidv4(),
      title: title,
      done: false,
      deadline: new Date(deadline),
      created_at: new Date()
    };

  user.todos.push(todo);

  return response.status(201).send(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request,
    {id} = request.params,
    {title, deadline} = request.body,
    {todos} = user;

  const todo = getUserTodoById(response, todos, id);

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(201).send(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const {user} = request,
    {todos} = user,
    {id} = request.params,
    todo = getUserTodoById(response, todos, id);

  todo.done = true;

  return response.status(201).send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request,
    {todos} = user,
    {id} = request.params;

  /**
   * utilizado para avaliar se o todo existe para o usuario.
   */
  getUserTodoById(response, todos, id);

  todos.splice(todos.findIndex(value => value.id === id), 1);

  return response.status(204).send();
});

module.exports = app;