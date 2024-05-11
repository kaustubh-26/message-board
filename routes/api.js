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
      const dateTime = new Date().toISOString();
      console.log('post', req.body);
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        created_on: dateTime,
        bumped_on: dateTime,
        reported: false,
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
        await newBoard.save();
        res.json(newThread);
      } else {
        data.threads.push(newThread);
        await data.save();
        res.json(newThread);
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const threads = data.threads.slice(0, 10).map((thread) => {
          const { _id, text, created_on, bumped_on, replies } = thread;
          const recentReplies = replies.slice(-3).map((reply) => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          }));
          return {
            _id,
            text,
            created_on,
            bumped_on,
            replies: recentReplies,
          };
        });
        res.json(threads);
      }
    })
    .put(async (req, res) => {
      const { thread_id } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      console.log('thread_id:', thread_id);
      console.log('board:', board);
      console.log('data:', board);
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const thread = data.threads.id(thread_id);
        console.log('thread::', thread);
        thread.reported = true; // Change the reported value of the thread
        await data.save();
        res.send('reported');
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
          res.send('incorrect password');
          return;
        }
        await data.save();
        res.send('success');
      }
    });

  app
    .route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      const dateTime = new Date(); // Get the current date and time
      const replyName = `fcc_test_reply_${dateTime.toISOString()}`; // Create a unique reply name based on the current date and time
      const newReply = new ReplyModel({
        text: text,
        created_on: dateTime,
        reported: false,
        delete_password: delete_password,
        name: replyName, // Assign the reply name
      });
      const data = await BoardModel.findOne({ name: board });

      if (!data) {
        res.json({ error: 'Board not found' });
      } else {
        const thread = data.threads.id(thread_id);
        if (!thread) {
          res.json({ error: 'Thread not found' });
        } else {
          thread.replies.push(newReply);
          thread.bumped_on = dateTime;
          let saved = await data.save();
          console.log('saved::::', saved);
          res.json(saved);
        }
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const thread = data.threads.id(req.query.thread_id);
        const { _id, text, created_on, bumped_on, replies } = thread;
        const allReplies = replies.map((reply) => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        }));
        res.json({
          _id,
          text,
          created_on,
          bumped_on,
          replies: allReplies,
        });
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
        const reply = thread.replies.id(reply_id);
        reply.reported = true; // Change the reported value of the reply
        await data.save();
        res.send('reported');
      }
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
      const data = await BoardModel.findOne({ name: board });
      if (!data) {
        res.json({ error: 'No board with this name' });
      } else {
        const thread = data.threads.id(thread_id);
        const reply = thread.replies.id(reply_id);
        if (reply.delete_password === delete_password) {
          reply.text = '[deleted]'; // Change the text of the reply to '[deleted]'
          await data.save();
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      }
    });
};
