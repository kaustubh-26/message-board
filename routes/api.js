'use strict';

const BoardModel = require('../models/schemas').Board;
const ThreadModel = require('../models/schemas').Thread;
const ReplyModel = require('../models/schemas').Reply;

module.exports = function (app) {
  app
    .route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      let board = req.body.board;
      if (!board) {
        board = req.params.board;
      }
      console.log('post', req.body);
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        replies: [],
      });
      // console.log('newThread', newThread);
      const data = await BoardModel.findOne({ name: board });

      // console.log('data::', data);
      if (!data) {
        let newBoard = new BoardModel({
          name: board,
          threads: [],
        });
        // console.log('newBoard', newBoard);
        newBoard.threads.push(newThread);
        newBoard.save();
        res.json(newThread);
      } else {
        data.threads.push(newThread);
        data.save();
        res.json(newThread);
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        console.log('No board with this name');
        res.json({ error: 'No board with this name' });
      } else {
        console.log('data', data);
        const threads = data.threads.map((thread) => {
          const {
            _id,
            text,
            created_on,
            bumped_on,
            reported,
            delete_password,
            replies,
          } = thread;
          // console.log('replies::', replies);
          return {
            _id,
            text,
            created_on,
            bumped_on,
            reported,
            delete_password,
            replies,
            replycount: replies.length,
          };
        });
        res.json(threads);
      }
    })
    .put(async (req, res) => {
      // console.log('put', req.body);
      const { report_id } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        res.json({ error: 'Board not found' });
      } else {
        const date = new Date();
        let reportedThread = data.threads.id(report_id);
        reportedThread.reported = true;
        reportedThread.bumped_on = date;
        data.save();
        res.send('Data Updated Successfully');
      }
    })
    .delete(async (req, res) => {
      // console.log('delete', req.body);
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        res.json({ error: 'Board not found' });
      } else {
        let threadToDelete = data.threads.id(thread_id);
        if (threadToDelete.delete_password === delete_password) {
          // console.log('threadToDelete:', threadToDelete);
          threadToDelete.deleteOne();
          // threadToDelete.remove();
        } else {
          res.send('Invalid Password');
          return;
        }
        data.save();
        res.send('Deleted Thread');
      }
    });

  app
    .route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      const newReply = new ReplyModel({
        text: text,
        delete_password: delete_password,
      });
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        res.json({ error: 'Board not found' });
      } else {
        const date = new Date();
        let threadToAddReply = data.threads.id(thread_id);
        threadToAddReply.bumped_on = date;
        threadToAddReply.replies.push(newReply);
        data.save();
        res.json(data);
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const thread = data.threads.id(req.query.thread_id);
        res.json(thread);
      }
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const thread = data.threads.id(thread_id);
        // console.log('put:->', thread);
        const reply = thread.replies.id(reply_id);
        reply.reported = true;
        reply.bumped_on = new Date();
        data.save();
        res.send('Data updated Successfully');
      }
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        // console.log('thread_id::::', thread_id);
        // console.log('reply_id::::', reply_id, delete_password);
        const thread = data.threads.id(thread_id);
        const reply = thread.replies.id(reply_id);
        let message = '';
        if (reply.delete_password === delete_password) {
          reply.deleteOne();
          message = 'Data deleted Successfully';
        } else {
          message = 'Invalid password';
        }
        if (message === 'Data deleted Successfully') {
          data.save();
        }
        res.send(message);
      }
    });
};
