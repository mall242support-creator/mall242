const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Create category (Admin only)
// @route   POST /api/admin/categories
// @access  Private (Admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, image, bannerImage, displayOrder, parent, isActive, isFeatured, seoTitle, seoDescription } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new BadRequestError('Category with this name already exists');
  }

  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const category = await Category.create({
    name,
    slug,
    description,
    icon: icon || 'bi-grid',
    image,
    bannerImage,
    displayOrder: displayOrder || 0,
    parent: parent || null,
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured || false,
    seoTitle,
    seoDescription,
  });

  logger.logRequest(req, `Category created: ${name} by admin ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
});

// @desc    Update category (Admin only)
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, image, bannerImage, displayOrder, parent, isActive, isFeatured, seoTitle, seoDescription } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Update slug if name changed
  let updateData = { description, icon, image, bannerImage, displayOrder, parent, isActive, isFeatured, seoTitle, seoDescription };
  if (name && name !== category.name) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  logger.logRequest(req, `Category updated: ${updatedCategory.name} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Category updated successfully',
    category: updatedCategory,
  });
});

// @desc    Delete category (Admin only)
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new BadRequestError(`Cannot delete category with ${productCount} products. Reassign products first.`);
  }

  await category.deleteOne();

  logger.logRequest(req, `Category deleted: ${category.name} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// @desc    Get all categories (for admin)
// @route   GET /api/admin/categories
// @access  Private (Admin only)
const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('displayOrder');
  
  res.json({
    success: true,
    categories,
  });
});

// @desc    Get single category (for admin)
// @route   GET /api/admin/categories/:id
// @access  Private (Admin only)
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  res.json({
    success: true,
    category,
  });
});

// Export all functions
module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesAdmin,
  getCategoryById,
};