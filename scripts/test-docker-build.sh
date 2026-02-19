#!/bin/bash
# Docker 构建测试脚本 - 快速验证 Dockerfile 是否可用

set -e

echo "🐳 Testing Docker build..."
echo "==========================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker to use this script"
    exit 1
fi

# 记录开始时间
START_TIME=$(date +%s)

# 构建镜像
echo ""
echo "Building Docker image (this may take a few minutes)..."
echo ""

if docker build -t jarvis-pwa:test .; then
    echo ""
    echo -e "${GREEN}✓ Docker build successful${NC}"

    # 显示镜像信息
    echo ""
    echo "Image details:"
    docker images jarvis-pwa:test

    # 测试运行容器
    echo ""
    echo "Testing container startup..."
    CONTAINER_ID=$(docker run -d -p 3001:3000 --name jarvis-test jarvis-pwa:test)

    # 等待容器启动
    echo "Waiting for container to start..."
    sleep 5

    # 检查容器状态
    if docker ps | grep -q jarvis-test; then
        echo -e "${GREEN}✓ Container is running${NC}"
        echo ""
        echo "Test the application at: http://localhost:3001"

        # 等待用户输入后清理
        echo ""
        echo "Press Enter to stop and remove the test container..."
        read

        docker stop jarvis-test > /dev/null 2>&1
        docker rm jarvis-test > /dev/null 2>&1
        echo -e "${GREEN}✓ Test container cleaned up${NC}"
    else
        echo -e "${RED}✗ Container failed to start${NC}"
        echo "Check logs with: docker logs jarvis-test"
        docker logs jarvis-test
        docker rm -f jarvis-test > /dev/null 2>&1
        exit 1
    fi

    # 清理测试镜像
    echo ""
    echo "Cleaning up test image..."
    docker rmi jarvis-pwa:test > /dev/null 2>&1
    echo -e "${GREEN}✓ Test image removed${NC}"

    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))

    echo ""
    echo "==========================="
    echo -e "${GREEN}✅ Docker deployment test passed!${NC}"
    echo "Time elapsed: ${MINUTES}m ${SECONDS}s"
    echo "==========================="

else
    echo ""
    echo -e "${RED}✗ Docker build failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi

exit 0
