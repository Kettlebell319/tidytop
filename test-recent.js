const { RecentManager } = require('./src/core/organize/recent');
const { DesktopOrganizer } = require('./src/core/organize/organizer');

async function testRecent() {
  console.log('🕒 Testing TidyTop Recent Functionality...\n');
  
  // First, organize files again so we have something to show in Recent
  console.log('📁 Organizing files first...');
  const organizer = new DesktopOrganizer();
  await organizer.cleanDesktop();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now test Recent functionality
  const recentManager = new RecentManager();
  
  try {
    const results = await recentManager.createRecentFolder();
    
    console.log('✅ Recent Folder Results:');
    console.log(`   📁 Folder created at: ${results.folderPath}`);
    console.log(`   📄 Recent files found: ${results.fileCount}`);
    
    console.log('\n🎉 Recent test completed successfully!');
    
    // Show what's in the Recent folder
    console.log('\n📋 Contents of Recent folder:');
    const fs = require('fs').promises;
    
    try {
      const entries = await fs.readdir(results.folderPath, { withFileTypes: true });
      entries.forEach(entry => {
        const icon = entry.isSymbolicLink() ? '🔗' : (entry.isDirectory() ? '📁' : '📄');
        console.log(`   ${icon} ${entry.name}`);
      });
    } catch (error) {
      console.log('   (Recent folder is empty or couldn\'t be read)');
    }
    
  } catch (error) {
    console.error('❌ Recent test failed:', error);
  }
}

testRecent().then(() => {
  console.log('\n🏁 Recent test script finished');
}).catch(console.error);