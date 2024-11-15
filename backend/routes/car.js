// routes/car.js
const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const authenticateToken = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { files: 10 },
});


/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Car created successfully
 *       400:
 *         description: All fields are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


/**
 * @route POST /api/cars
 * @desc Create a new car
 * @access Private
 */
router.post(
  "/",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    const { title, description, tags } = req.body;
    const files = req.files;

    if (!title || !description || !tags)
      return res.status(400).json({ message: "All fields are required" });

    try {
      // Create car
      const car = await prisma.car.create({
        data: {
          title,
          description,
          user: { connect: { id: req.user.userId } },
        },
      });

      // Handle images
      if (files && files.length > 0) {
        const imagePromises = files.map((file) =>
          prisma.image.create({
            data: {
              url: file.path,
              car: { connect: { id: car.id } },
            },
          })
        );
        await Promise.all(imagePromises);
      }

      // Handle tags
      const tagList = tags.split(",").map((tag) => tag.trim());
      const tagPromises = tagList.map(async (tagName) => {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } });
        }
        await prisma.car.update({
          where: { id: car.id },
          data: { tags: { connect: { id: tag.id } } },
        });
      });
      await Promise.all(tagPromises);

      res.status(201).json({ message: "Car created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;


/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars of the logged-in user
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cars
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


/**
 * @route GET /api/cars
 * @desc Get all cars of the logged-in user
 * @access Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: { userId: req.user.userId },
      include: {
        images: true,
        tags: true,
      },
    });
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car details by ID
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */


/**
 * @route GET /api/cars/:id
 * @desc Get car details by ID
 * @access Private
 */
router.get("/:id", authenticateToken, async (req, res) => {
  const carId = parseInt(req.params.id);

  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        images: true,
        tags: true,
      },
    });

    if (!car) return res.status(404).json({ message: "Car not found" });
    if (car.userId !== req.user.userId)
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update car details
 *     description: Partially update car details including title, description, images, and tags. Requires authentication.
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the car to update
 *       - in: formData
 *         name: title
 *         schema:
 *           type: string
 *         required: false
 *         description: New title of the car
 *       - in: formData
 *         name: description
 *         schema:
 *           type: string
 *         required: false
 *         description: New description of the car
 *       - in: formData
 *         name: tags
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated list of tags to add to the car
 *       - in: formData
 *         name: images
 *         type: array
 *         items:
 *           type: string
 *           format: binary
 *         required: false
 *         description: New images to add (up to 10 files can be uploaded, and existing images will not be deleted)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: New title of the car
 *               description:
 *                 type: string
 *                 description: New description of the car
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags to add to the car
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New images to add (up to 10 files can be uploaded, existing images will not be deleted)
 *     responses:
 *       200:
 *         description: Car updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 car:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           url:
 *                             type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized - Bearer token is missing or invalid
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */


router.put(
  "/:id",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    const carId = parseInt(req.params.id);
    const { title, description, tags } = req.body;
    const files = req.files;

    try {
      let car = await prisma.car.findUnique({ where: { id: carId } });
      if (!car) return res.status(404).json({ message: "Car not found" });
      if (car.userId !== req.user.userId) 
        return res.status(403).json({ message: "Access denied" });

      // Partially update car details
      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;

      car = await prisma.car.update({
        where: { id: carId },
        data: updateData,
      });

      // Add new images if provided, keep existing ones
      if (files && files.length > 0) {
        const imagePromises = files.map((file) =>
          prisma.image.create({
            data: {
              url: file.path,
              car: { connect: { id: carId } },
            },
          })
        );
        await Promise.all(imagePromises);
      }

      // Add tags if provided
      if (tags) {
        const tagList = tags.split(",").map((tag) => tag.trim());
        const tagPromises = tagList.map(async (tagName) => {
          let tag = await prisma.tag.findUnique({ where: { name: tagName } });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } });
          }
          await prisma.car.update({
            where: { id: carId },
            data: { tags: { connect: { id: tag.id } } },
          });
        });
        await Promise.all(tagPromises);
      }

      // Fetch updated car with related images and tags
      car = await prisma.car.findUnique({
        where: { id: carId },
        include: {
          images: true,
          tags: true,
        },
      });

      res.status(200).json({ message: "Car updated successfully", car });
    } catch (error) {
      console.error("Error updating car:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);



/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete a car
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */

/**
 * @route DELETE /api/cars/:id
 * @desc Delete a car
 * @access Private
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  const carId = parseInt(req.params.id);

  try {
    const car = await prisma.car.findUnique({ where: { id: carId } });

    if (!car) return res.status(404).json({ message: "Car not found" });
    if (car.userId !== req.user.userId)
      return res.status(403).json({ message: "Access denied" });

    // Delete images from storage
    const images = await prisma.image.findMany({ where: { carId } });
    for (const image of images) {
      const filePath = path.resolve(image.url); // Adjust path as needed
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error(`Failed to delete file ${filePath}:`, fileError);
      }
    }

    // Delete car and linked images in database
    await prisma.image.deleteMany({ where: { carId } });
    await prisma.car.delete({ where: { id: carId } });

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/cars/search/{keyword}:
 *   get:
 *     summary: Search cars by keyword
 *     description: Search for cars by keyword in the title, description, or tags. Requires authentication.
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: Keyword to search in car title, description, or tags
 *     responses:
 *       200:
 *         description: A list of cars that match the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         url:
 *                           type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *       401:
 *         description: Unauthorized - Bearer token is missing or invalid
 *       500:
 *         description: Server error - An error occurred on the server
 */

/**
 * @route GET /api/cars/search/:keyword
 * @desc Search cars by keyword
 * @access Private
 */
router.get("/search/:keyword", authenticateToken, async (req, res) => {
  const { keyword } = req.params;
  console.log("Keyword:", keyword);
  console.log("User ID from token:", req.user?.userId);

  try {
    const searchFilter = {
      userId: req.user.userId,
      OR: keyword
        ? [
            { title: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            {
              tags: {
                some: {
                  name: { contains: keyword, mode: "insensitive" },
                },
              },
            },
          ]
        : undefined,
    };

    console.log("Search Filter:", JSON.stringify(searchFilter, null, 2));

    const cars = await prisma.car.findMany({
      where: searchFilter,
      include: {
        images: true,
        tags: true,
      },
    });

    console.log("Cars found:", cars);
    res.status(200).json(cars);
  } catch (error) {
    console.error("Error searching cars:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
