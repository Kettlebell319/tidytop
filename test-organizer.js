const { DesktopOrganizer } = require('./src/core/organize/organizer');

async function testOrganizer() {
  console.log('🧪 Testing TidyTop Desktop Organizer...\n');
  
  const organizer = new DesktopOrganizer();
  
  try {
    // Test the organization logic
    const results = await organizer.cleanDesktop();
    
    console.log('✅ Organization Results:');
    console.log(`   📁 Files moved: ${results.movedCount}`);
    console.log(`   ⏭️  Files skipped: ${results.skippedCount}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => {
        console.log(`   ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Test completed successfully!');
    
    // Show what's on desktop now
    console.log('\n📋 Current desktop contents:');
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const entries = await fs.readdir(desktopPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const icon = entry.isDirectory() ? '📁' : '📄';
      console.log(`   ${icon} ${entry.name}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOrganizer().then(() => {
  console.log('\n🏁 Test script finished');
}).catch(console.error);