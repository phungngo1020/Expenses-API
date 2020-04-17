const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Expense = require('../models/expense')
const Test = require('../models/test')

// CREATE a expense
router.post('/expenses', auth, async (req, res) => {
    const expense = new Expense({
        ...req.body,     
        owner: req.user._id
    }) // ...req.body copy all values from req.body over

    try {
        await expense.save()
        res.status(201).send(expense)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/all', async (req, res) => {
    const test = new Test({name: req.body.name}) // ...req.body copy all values from req.body over
    try {
        await test.save()
        res.status(201).send(test)
    } catch (error) {
        res.status(500).send(error)
    }
})

// Test
router.get('/all', async (req, res) => {
    try {
        await res.send("All")
    } catch (error) {
        console.log(error)
    }
})


// GET /expenses?limit=10&skip=10
// GET /expenses?sortBy=createdAt:desc
router.get('/expenses', auth, async (req, res) => {
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'expenses',
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.expenses)
    } catch (error) {
        res.status(500).send()
    }
})

// READ a expense by its Id
router.get('/expenses/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const expense = await Expense.findOne({ _id, owner: req.user._id })

        if (!expense) {
            return res.status(404).send()
        }
        
        res.send(expense)
    } catch (error) {
        res.status(500).send(error);
    }
})

// UPDATE expense
router.patch('/expenses/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const expense = await Expense.findOne({ _id: req.params.id, owner: req.user._id })

        if (!expense) {
            return res.status(404).send()
        }

        updates.forEach((update) => { expense[update] = req.body[update] })
        await expense.save()
        res.send(expense)
    } catch (e) {
        res.status(400).send(e)
    }
})

// DELETE expense
router.delete('/expenses/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!expense) {
            return res.status(404).send()
        }
        res.send(expense)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router
