const getPaginationMeta = (page, limit, total) => {
    const currentPage = Math.max(1, Number(page) || 1);
    const itemsPerPage = Math.max(1, Number(limit) || 1);
    const totalItems = Math.max(0, Number(total) || 0);

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    return {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
};

export default getPaginationMeta;
