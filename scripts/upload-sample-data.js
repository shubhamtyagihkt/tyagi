#!/usr/bin/env node

/**
 * Sample Data Upload Script for Tyagi Business Management System
 * Generates and uploads ~1000 entries of sample data including:
 * - SKUs (products and services)
 * - Purchases (inventory)
 * - Sales (items and services)
 * - Expenses
 * - Investments
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'http://localhost:8080/api';
const TOTAL_ENTRIES = 1000;

// Categories and data pools
const CATEGORIES = {
  'Engine Parts': ['Piston', 'Cylinder', 'Crankshaft', 'Camshaft', 'Valve', 'Timing Belt'],
  'Electrical': ['Battery', 'Alternator', 'Starter Motor', 'Spark Plug', 'Wiring Harness', 'Fuse'],
  'Brake System': ['Brake Pad', 'Brake Disc', 'Brake Caliper', 'Brake Hose', 'Master Cylinder'],
  'Suspension': ['Shock Absorber', 'Strut', 'Control Arm', 'Ball Joint', 'Tie Rod'],
  'Transmission': ['Clutch Kit', 'Gearbox', 'CV Joint', 'Drive Shaft', 'Transmission Fluid'],
  'Body Parts': ['Bumper', 'Fender', 'Door Panel', 'Headlight', 'Taillight', 'Mirror'],
  'Filters': ['Oil Filter', 'Air Filter', 'Fuel Filter', 'Cabin Filter'],
  'Belts & Hoses': ['Serpentine Belt', 'Timing Belt', 'Radiator Hose', 'Fuel Hose']
};

const BRANDS = ['Bosch', 'NGK', 'Denso', 'Valeo', 'Sachs', 'GKN', 'TRW', 'Delphi', 'ACDelco', 'Motorcraft'];
const UNITS = ['piece', 'kg', 'litre', 'metre'];
const VENDORS = ['AutoParts Inc', 'PartsPlus', 'CarCare Depot', 'MotorMasters', 'SpeedyParts', 'QualityAuto'];
const CUSTOMERS = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emma Wilson', 'David Brown', 'Lisa Garcia', 'Tom Anderson', 'Jennifer Lee'];

const SERVICE_TYPES = ['Oil Change', 'Brake Service', 'Tire Rotation', 'Battery Replacement', 'Engine Tune-up', 'Transmission Service', 'AC Service', 'Wheel Alignment'];

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Insurance', 'Maintenance', 'Supplies', 'Transportation', 'Miscellaneous'];

// Date utilities
function getDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getRandomDateInRange(startDaysAgo, endDaysAgo) {
  const days = Math.floor(Math.random() * (endDaysAgo - startDaysAgo + 1)) + startDaysAgo;
  return getDate(days);
}

// Random data generators
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateSKUId(category, brand) {
  const catCode = category.substring(0, 2).toUpperCase();
  const brandCode = brand.substring(0, 2).toUpperCase();
  const randomNum = randomInt(1000, 9999);
  return `${catCode}${brandCode}${randomNum}`;
}

// Data generators
function generateSKUs(count = 200) {
  const skus = [];
  const usedIds = new Set();

  for (let i = 0; i < count; i++) {
    const category = randomChoice(Object.keys(CATEGORIES));
    const subcategory = randomChoice(CATEGORIES[category]);
    const brand = randomChoice(BRANDS);
    const unit = randomChoice(UNITS);

    let skuId;
    do {
      skuId = generateSKUId(category, brand);
    } while (usedIds.has(skuId));
    usedIds.add(skuId);

    const name = `${brand} ${subcategory} for ${category}`;
    const expectedPrice = randomFloat(50, 2000);

    skus.push({
      id: skuId,
      name,
      category,
      subcategory,
      brand,
      unit,
      expected_sale_price: expectedPrice,
      min_stock: randomInt(5, 20)
    });
  }

  // Add some service SKUs
  for (let i = 0; i < 20; i++) {
    const serviceType = randomChoice(SERVICE_TYPES);
    const skuId = `SRV${randomInt(1000, 9999)}`;

    skus.push({
      id: skuId,
      name: serviceType,
      category: 'Services',
      subcategory: serviceType,
      brand: 'In-House',
      unit: 'service',
      expected_sale_price: randomFloat(50, 500),
      min_stock: 0
    });
  }

  return skus;
}

function generatePurchases(skus, count = 300, skuIdMap = null) {
  const purchases = [];

  for (let i = 0; i < count; i++) {
    const sku = randomChoice(skus.filter(s => s.unit !== 'service')); // Only physical items
    const qty = randomInt(1, 50);
    const purchasePrice = sku.expected_sale_price * randomFloat(0.3, 0.7); // 30-70% of sale price
    const date = getRandomDateInRange(0, 30); // Last 30 days

    // Use real SKU ID if mapping is provided
    const skuId = skuIdMap ? skuIdMap.get(sku.id) || sku.id : sku.id;

    purchases.push({
      sku_id: skuId,
      qty,
      purchase_price: purchasePrice,
      vendor: randomChoice(VENDORS),
      invoice_number: `INV${randomInt(10000, 99999)}`,
      date
    });
  }

  return purchases;
}

function generateSales(skus, count = 400, skuIdMap = null) {
  const sales = [];

  for (let i = 0; i < count; i++) {
    const sku = randomChoice(skus);
    const isService = sku.unit === 'service';
    const qty = isService ? 1 : randomInt(1, 10);
    const salePrice = sku.expected_sale_price * randomFloat(0.8, 1.5); // 80-150% of expected price
    const date = getRandomDateInRange(0, 30);

    // Use real SKU ID if mapping is provided
    const skuId = skuIdMap ? skuIdMap.get(sku.id) || sku.id : sku.id;

    sales.push({
      sku_id: skuId,
      sale_type: isService ? 'service' : 'item',
      service_name: isService ? sku.name : '',
      qty,
      sale_price: salePrice,
      customer: randomChoice(CUSTOMERS),
      date
    });
  }

  return sales;
}

function generateExpenses(count = 50) {
  const expenses = [];

  for (let i = 0; i < count; i++) {
    const category = randomChoice(EXPENSE_CATEGORIES);
    const amount = randomFloat(100, 5000);
    const date = getRandomDateInRange(0, 30);

    expenses.push({
      title: `${category} expense`,
      amount,
      notes: `Expense for ${category.toLowerCase()}`,
      date
    });
  }

  return expenses;
}

function generateInvestments(count = 20) {
  const investments = [];

  for (let i = 0; i < count; i++) {
    const amount = randomFloat(1000, 50000);
    const title = `Investment ${i + 1}`;
    const date = getRandomDateInRange(0, 60); // Last 60 days

    investments.push({
      title,
      amount,
      date
    });
  }

  return investments;
}

// API upload functions
async function uploadData(endpoint, data, name) {
  console.log(`\n📤 Uploading ${data.length} ${name}...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        successCount++;
        // Show progress every 50 items or for small datasets
        if ((i + 1) % Math.min(50, Math.max(1, data.length / 4)) === 0) {
          console.log(`  ✅ Uploaded ${i + 1}/${data.length} ${name}`);
        }
      } else {
        const error = await response.text();
        console.error(`  ❌ Failed to upload ${name} ${i + 1}: ${error}`);
        console.error(`     Data: ${JSON.stringify(item)}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`  ❌ Network error uploading ${name} ${i + 1}: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log(`✅ ${name} upload complete: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Main execution
async function main() {
  console.log('🚀 Starting Tyagi Sample Data Upload Script');
  console.log(`📊 Target: ~${TOTAL_ENTRIES} total entries`);
  console.log('🌐 API Base:', API_BASE);

  try {
    // Generate data
    console.log('\n🎲 Generating sample data...');

    const skus = generateSKUs(200);
    console.log(`📦 Generated ${skus.length} SKUs`);

    // Upload SKUs first and collect their real IDs
    console.log('\n📤 Uploading SKUs and collecting IDs...');
    const skuIdMap = new Map(); // script-generated ID -> real API-generated ID

    let skuSuccessCount = 0;
    let skuErrorCount = 0;

    for (let i = 0; i < skus.length; i++) {
      const item = skus[i];
      const scriptId = item.id;

      // Remove the id field since API generates it
      const apiData = { ...item };
      delete apiData.id;

      try {
        const response = await fetch(`${API_BASE}/sku`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        });

        if (response.ok) {
          const result = await response.json();
          skuIdMap.set(scriptId, result.id);
          skuSuccessCount++;
          if ((i + 1) % 50 === 0) {
            console.log(`  ✅ Uploaded ${i + 1}/${skus.length} SKUs`);
          }
        } else {
          const error = await response.text();
          console.error(`  ❌ Failed to upload SKU ${i + 1}: ${error}`);
          console.error(`     Data: ${JSON.stringify(apiData)}`);
          skuErrorCount++;
        }
      } catch (error) {
        console.error(`  ❌ Network error uploading SKU ${i + 1}: ${error.message}`);
        skuErrorCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`✅ SKUs upload complete: ${skuSuccessCount} success, ${skuErrorCount} errors`);

    if (skuSuccessCount === 0) {
      throw new Error('No SKUs were uploaded successfully. Cannot continue with purchases and sales.');
    }

    // Generate purchases and sales using real SKU IDs
    const purchases = generatePurchases(skus, 300, skuIdMap);
    const sales = generateSales(skus, 400, skuIdMap);
    const expenses = generateExpenses(50);
    const investments = generateInvestments(20);

    console.log(`📦 Generated ${purchases.length} purchases`);
    console.log(`📦 Generated ${sales.length} sales`);
    console.log(`📦 Generated ${expenses.length} expenses`);
    console.log(`📦 Generated ${investments.length} investments`);

    // Upload remaining data
    const results = {
      purchases: await uploadData('/purchase', purchases, 'Purchases'),
      sales: await uploadData('/sale', sales, 'Sales'),
      expenses: await uploadData('/expense', expenses, 'Expenses'),
      investments: await uploadData('/finance/investment', investments, 'Investments'),
    };

    // Add SKU results
    results.skus = { success: skuSuccessCount, errors: skuErrorCount };

    // Summary
    const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    console.log('\n🎉 Upload Summary:');
    console.log(`✅ Total Successful: ${totalSuccess}`);
    console.log(`❌ Total Errors: ${totalErrors}`);
    console.log(`📊 Success Rate: ${((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1)}%`);

    if (totalSuccess > 0) {
      console.log('\n🎊 Sample data uploaded successfully!');
      console.log('📅 Data includes entries from today, yesterday, this week, and past weeks');
      console.log('📊 Includes low stock scenarios, item sales, service sales, investments, and expenses');
    }

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/sku`);
    return response.ok;
  } catch {
    return false;
  }
}

// Run the script
async function run() {
  console.log('🔍 Checking if server is running...');

  if (!(await checkServer())) {
    console.error('❌ Server is not running at', API_BASE);
    console.log('💡 Please start the backend server first:');
    console.log('   cd backend && go run main.go');
    process.exit(1);
  }

  console.log('✅ Server is running');
  await main();
}

run().catch(console.error);