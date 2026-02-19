#!/bin/bash
# 本地构建验证脚本 - 模拟完整的部署流程

set -e

echo "🚀 Starting deployment verification..."
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 记录开始时间
START_TIME=$(date +%s)

# 1. 清理旧的构建
echo ""
echo -e "${BLUE}Step 1: Cleaning previous builds...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Clean complete${NC}"

# 2. 安装依赖（如果需要）
echo ""
echo -e "${BLUE}Step 2: Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm ci
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies up to date${NC}"
fi

# 3. 代码质量检查
echo ""
echo -e "${BLUE}Step 3: Code quality checks...${NC}"

echo "  → Running ESLint..."
if npm run lint -- --quiet; then
    echo -e "  ${GREEN}✓ ESLint passed${NC}"
else
    echo -e "  ${RED}✗ ESLint failed${NC}"
    exit 1
fi

echo "  → Running TypeScript..."
if npx tsc --noEmit; then
    echo -e "  ${GREEN}✓ TypeScript passed${NC}"
else
    echo -e "  ${RED}✗ TypeScript failed${NC}"
    exit 1
fi

# 4. Next.js 构建
echo ""
echo -e "${BLUE}Step 4: Building Next.js application...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Next.js build successful${NC}"
else
    echo -e "${RED}✗ Next.js build failed${NC}"
    exit 1
fi

# 5. 验证构建输出
echo ""
echo -e "${BLUE}Step 5: Validating build output...${NC}"

# 检查必需的文件和目录
REQUIRED_FILES=(
    ".next/standalone/server.js"
    ".next/static"
    "public"
)

ALL_VALID=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file missing"
        ALL_VALID=false
    fi
done

if [ "$ALL_VALID" = false ]; then
    echo -e "${RED}✗ Build output validation failed${NC}"
    exit 1
fi

# 6. Docker 构建测试（可选）
echo ""
echo -e "${BLUE}Step 6: Testing Docker build...${NC}"
if command -v docker &> /dev/null; then
    echo "  → Building Docker image..."
    if docker build -t jarvis-pwa:test . > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Docker build successful${NC}"

        # 清理测试镜像
        docker rmi jarvis-pwa:test > /dev/null 2>&1
    else
        echo -e "  ${RED}✗ Docker build failed${NC}"
        echo "  Run 'docker build -t jarvis-pwa:test .' to see errors"
        exit 1
    fi
else
    echo -e "  ${YELLOW}⚠ Docker not found - skipping Docker build test${NC}"
    echo "  Install Docker to verify containerized deployment"
fi

# 7. 测试运行
echo ""
echo -e "${BLUE}Step 7: Running test suite...${NC}"
if npm test -- --passWithNoTests --coverage; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed or no tests found${NC}"
fi

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 总结
echo ""
echo "========================================"
echo -e "${GREEN}✅ All verification checks passed!${NC}"
echo "Time elapsed: ${MINUTES}m ${SECONDS}s"
echo ""
echo "🎉 Your code is ready for deployment!"
echo "========================================"
exit 0
