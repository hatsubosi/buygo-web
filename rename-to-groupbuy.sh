#!/bin/bash
set -e

echo "🔄 Starting Project → GroupBuy frontend refactoring..."

cd "$(dirname "$0")"

# ============================================
# Phase 1: Rename Directories
# ============================================
echo "📁 Phase 1: Renaming directories"

# Core layer
if [ -d "src/app/core/project" ]; then
    mv src/app/core/project src/app/core/groupbuy
    echo "   ✓ core/project → core/groupbuy"
fi

# Features layer
if [ -d "src/app/features/project" ]; then
    mv src/app/features/project src/app/features/groupbuy
    echo "   ✓ features/project → features/groupbuy"
fi

# Manager features
if [ -d "src/app/features/manager/project-detail" ]; then
    mv src/app/features/manager/project-detail src/app/features/manager/groupbuy-detail
    echo "   ✓ manager/project-detail → manager/groupbuy-detail"
fi

if [ -d "src/app/features/manager/project-form" ]; then
    mv src/app/features/manager/project-form src/app/features/manager/groupbuy-form
    echo "   ✓ manager/project-form → manager/groupbuy-form"
fi

# ============================================
# Phase 2: Rename Files in Core
# ============================================
echo "📄 Phase 2: Renaming core files"

if [ -f "src/app/core/groupbuy/project.actions.ts" ]; then
    mv src/app/core/groupbuy/project.actions.ts src/app/core/groupbuy/groupbuy.actions.ts
fi
if [ -f "src/app/core/groupbuy/project.reducer.ts" ]; then
    mv src/app/core/groupbuy/project.reducer.ts src/app/core/groupbuy/groupbuy.reducer.ts
fi
if [ -f "src/app/core/groupbuy/project.selectors.ts" ]; then
    mv src/app/core/groupbuy/project.selectors.ts src/app/core/groupbuy/groupbuy.selectors.ts
fi
if [ -f "src/app/core/groupbuy/project.effects.ts" ]; then
    mv src/app/core/groupbuy/project.effects.ts src/app/core/groupbuy/groupbuy.effects.ts
fi
if [ -f "src/app/core/groupbuy/project.service.ts" ]; then
    mv src/app/core/groupbuy/project.service.ts src/app/core/groupbuy/groupbuy.service.ts
fi
if [ -f "src/app/core/groupbuy/project.service.spec.ts" ]; then
    mv src/app/core/groupbuy/project.service.spec.ts src/app/core/groupbuy/groupbuy.service.spec.ts
fi

echo "   ✓ Core files renamed"

# ============================================
# Phase 3: Rename Component Subdirectories
# ============================================
echo "📄 Phase 3: Renaming component subdirectories"

# User features subdirectories
if [ -d "src/app/features/groupbuy/project-detail" ]; then
    mv src/app/features/groupbuy/project-detail src/app/features/groupbuy/groupbuy-detail
fi
if [ -d "src/app/features/groupbuy/project-list" ]; then
    mv src/app/features/groupbuy/project-list src/app/features/groupbuy/groupbuy-list
fi
if [ -d "src/app/features/groupbuy/project-checkout" ]; then
    mv src/app/features/groupbuy/project-checkout src/app/features/groupbuy/groupbuy-checkout
fi

echo "   ✓ Component subdirectories renamed"

# ============================================
# Phase 4: Rename Component Files
# ============================================
echo "📄 Phase 4: Renaming component files"

# Rename files in groupbuy feature directories
for dir in src/app/features/groupbuy/*/; do
    if [ -d "$dir" ]; then
        # Rename TypeScript files
        for file in "$dir"project-*.component.ts; do
            if [ -f "$file" ]; then
                new_file=$(echo "$file" | sed 's/project-/groupbuy-/g')
                mv "$file" "$new_file"
            fi
        done
        # Rename HTML files
        for file in "$dir"project-*.component.html; do
            if [ -f "$file" ]; then
                new_file=$(echo "$file" | sed 's/project-/groupbuy-/g')
                mv "$file" "$new_file"
            fi
        done
        # Rename CSS files
        for file in "$dir"project-*.component.css; do
            if [ -f "$file" ]; then
                new_file=$(echo "$file" | sed 's/project-/groupbuy-/g')
                mv "$file" "$new_file"
            fi
        done
        # Rename spec files
        for file in "$dir"project-*.component.spec.ts; do
            if [ -f "$file" ]; then
                new_file=$(echo "$file" | sed 's/project-/groupbuy-/g')
                mv "$file" "$new_file"
            fi
        done
    fi
done

# Rename files in manager groupbuy directories
for dir in src/app/features/manager/groupbuy-*/; do
    if [ -d "$dir" ]; then
        for file in "$dir"*project*.component.*; do
            if [ -f "$file" ]; then
                new_file=$(echo "$file" | sed 's/project/groupbuy/g')
                mv "$file" "$new_file"
            fi
        done
    fi
done

echo "   ✓ Component files renamed"

# ============================================
# Phase 5: Content Replacement
# ============================================
echo "🔍 Phase 5: Replacing content in TypeScript and HTML files"

# Find all TS, HTML, and CSS files (excluding node_modules and generated proto files for now)
find src -type f \( -name "*.ts" -o -name "*.html" -o -name "*.css" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/core/api/*" | while read file; do

    # Import paths
    sed -i.bak \
        -e "s|'@core/project|'@core/groupbuy|g" \
        -e "s|\"@core/project|\"@core/groupbuy|g" \
        -e "s|from '@app/core/project|from '@app/core/groupbuy|g" \
        -e "s|from 'app/core/project|from 'app/core/groupbuy|g" \
        -e "s|features/project|features/groupbuy|g" \
        -e "s|manager/project-|manager/groupbuy-|g" \
        "$file"

    # Class names and types
    sed -i.bak \
        -e 's/\bProjectService\b/GroupBuyService/g' \
        -e 's/\bProjectActions\b/GroupBuyActions/g' \
        -e 's/\bProjectState\b/GroupBuyState/g' \
        -e 's/\bProjectEffects\b/GroupBuyEffects/g' \
        -e 's/\bProjectDetailComponent\b/GroupBuyDetailComponent/g' \
        -e 's/\bProjectListComponent\b/GroupBuyListComponent/g' \
        -e 's/\bProjectCheckoutComponent\b/GroupBuyCheckoutComponent/g' \
        -e 's/\bManagerProjectDetailComponent\b/ManagerGroupBuyDetailComponent/g' \
        -e 's/\bManagerProjectFormComponent\b/ManagerGroupBuyFormComponent/g' \
        "$file"

    # Action creators and selectors
    sed -i.bak \
        -e 's/\bloadProjects\b/loadGroupBuys/g' \
        -e 's/\bloadProject\b/loadGroupBuy/g' \
        -e 's/\bcreateProject\b/createGroupBuy/g' \
        -e 's/\bupdateProject\b/updateGroupBuy/g' \
        -e 's/\bselectProject\b/selectGroupBuy/g' \
        -e 's/\bselectProjects\b/selectGroupBuys/g' \
        -e 's/\bselectAllProjects\b/selectAllGroupBuys/g' \
        -e 's/\bselectProjectById\b/selectGroupBuyById/g' \
        -e 's/\bselectCurrentProject\b/selectCurrentGroupBuy/g' \
        "$file"

    # Store feature keys (in strings)
    sed -i.bak \
        -e "s/'project'/'groupbuy'/g" \
        -e 's/"project"/"groupbuy"/g' \
        "$file"

    # Component selectors
    sed -i.bak \
        -e "s/selector: 'app-project-detail'/selector: 'app-groupbuy-detail'/g" \
        -e "s/selector: 'app-project-list'/selector: 'app-groupbuy-list'/g" \
        -e "s/selector: 'app-project-checkout'/selector: 'app-groupbuy-checkout'/g" \
        -e "s/selector: 'app-manager-project-detail'/selector: 'app-manager-groupbuy-detail'/g" \
        -e "s/selector: 'app-manager-project-form'/selector: 'app-manager-groupbuy-form'/g" \
        "$file"

    # HTML tags
    sed -i.bak \
        -e 's/<app-project-detail/<app-groupbuy-detail/g' \
        -e 's/<\/app-project-detail>/<\/app-groupbuy-detail>/g' \
        -e 's/<app-project-list/<app-groupbuy-list/g' \
        -e 's/<\/app-project-list>/<\/app-groupbuy-list>/g' \
        "$file"

    # Variable names (be careful with common words)
    sed -i.bak \
        -e 's/\bproject: GroupBuy/groupBuy: GroupBuy/g' \
        -e 's/\bprojects: GroupBuy/groupBuys: GroupBuy/g' \
        -e 's/\bproject\$/groupBuy$/g' \
        -e 's/\bprojects\$/groupBuys$/g' \
        -e 's/\bproject = /groupBuy = /g' \
        -e 's/\bprojects = /groupBuys = /g' \
        -e 's/(project)/(groupBuy)/g' \
        -e 's/(projects)/(groupBuys)/g' \
        "$file"

    rm -f "${file}.bak"
done

echo "   ✓ Content replaced in TS/HTML/CSS files"

# ============================================
# Phase 6: Update Routes
# ============================================
echo "🔍 Phase 6: Updating route paths"

if [ -f "src/app/app.routes.ts" ]; then
    sed -i.bak \
        -e "s|path: 'project'|path: 'groupbuy'|g" \
        -e "s|/project/|/groupbuy/|g" \
        src/app/app.routes.ts
    rm -f src/app/app.routes.ts.bak
    echo "   ✓ Routes updated"
fi

# ============================================
# Phase 7: Remove Old Proto Files
# ============================================
echo "🗑️  Phase 7: Removing old proto-generated files"
rm -f src/app/core/api/api/v1/project_pb.ts
rm -f src/app/core/api/api/v1/project_connect.ts
echo "   ✓ Old proto files removed (will regenerate)"

# ============================================
# Phase 8: Clean up backup files
# ============================================
echo "🧹 Phase 8: Cleaning up backup files"
find src -name "*.bak" -type f -delete
echo "   ✓ Backup files cleaned"

echo ""
echo "✅ Frontend refactoring complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Regenerate proto: cd ../buygo-api && buf generate"
echo "  2. Install dependencies if needed: npm install"
echo "  3. Build project: npm run build"
echo "  4. Run tests: npm test"
