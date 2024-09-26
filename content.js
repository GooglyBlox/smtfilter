function hasIMadeThisFlair(postElement) {
    const flair = postElement.querySelector('.flair-content');
    return flair && flair.textContent.trim().toLowerCase() === 'i made this!';
}

function getAllLinksWithin(element) {
    let links = [];

    function traverse(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.tagName.toLowerCase() === 'a') {
            links.push(node);
        }

        if (node.shadowRoot) {
            node.shadowRoot.childNodes.forEach(child => traverse(child));
        }

        node.childNodes.forEach(child => traverse(child));
    }

    traverse(element);
    return links;
}

function containsSMTURL(postElement) {
    let description = postElement.querySelector('[slot="text-body"] div');

    if (!description) {
        const possibleContainers = traverseShadowRoots(postElement, '[slot="text-body"] div');
        if (possibleContainers.length > 0) {
            description = possibleContainers[0];
        }
    }

    if (!description) return false;

    const links = getAllLinksWithin(description);

    const regex = /https?:\/\/(?:www\.)?reddit\.com\/r\/SomebodyMakeThis\/[^\s"']+|\/r\/SomebodyMakeThis\/[^\s"']+/i;

    return links.some(link => regex.test(link.href));
}

function hidePost(postElement) {
    postElement.style.display = 'none';
}

function processPosts() {
    const posts = document.querySelectorAll('shreddit-post');

    posts.forEach(post => {
        if (hasIMadeThisFlair(post) && !containsSMTURL(post)) {
            hidePost(post);
        }
    });
}

function traverseShadowRoots(element, selector) {
    let elements = [];

    function traverse(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.matches && node.matches(selector)) {
            elements.push(node);
        }

        if (node.shadowRoot) {
            node.shadowRoot.childNodes.forEach(child => traverse(child));
        }

        node.childNodes.forEach(child => traverse(child));
    }

    traverse(element);
    return elements;
}

function isOnSMTPage() {
    const url = window.location.href;
    return /^https?:\/\/(www\.)?reddit\.com\/r\/SomebodyMakeThis\/?/.test(url);
}

let lastUrl = window.location.href;

function handleUrlChange() {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        if (isOnSMTPage()) {
            processPosts();
        }
    }
}

const observer = new MutationObserver(mutations => {
    handleUrlChange();

    let shouldProcess = false;
    for (let mutation of mutations) {
        if (mutation.addedNodes.length) {
            shouldProcess = true;
            break;
        }
    }
    if (shouldProcess && isOnSMTPage()) {
        processPosts();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isOnSMTPage()) {
            processPosts();
        }
    });
} else {
    if (isOnSMTPage()) {
        processPosts();
    }
}
