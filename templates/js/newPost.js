var newPostScroll = document.getElementById('dialog_scroll');
newPostScroll.onscroll = function () {
    var scroll = newPostScroll.scrollTop;
    var header = document.getElementById('dialog_header');
    var headerImage = document.getElementById('newPostImg');
    var linkButtons = document.getElementById('newPostLinkButtons');
    var newPostContent = document.getElementById('newPostContent');
    if (scroll < 116) {
        linkButtons.style.opacity = '1';
        header.style.width = '100%';
        header.style.borderTopRightRadius = '0px';
        header.style.boxShadow = "";
        header.style.height = 156 - scroll + 'px';
        header.style.margin = scroll + 'px 0 0 0';
        header.style.position = 'relative';
        headerImage.style.top = -20 - (scroll / 5) + 'px';
        newPostContent.style.margin = '0 0 0 0';
    } else {
        header.style.topRightBorderRadius = '4px';
        header.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        header.style.width = '450px';
        header.style.margin = '0 0 0 0';
        header.style.height = '42px';
        header.style.position = 'fixed';
        newPostContent.style.margin = '156px 0 0 0';
        linkButtons.style.opacity = 0;
    }
    if (scroll > 87 & scroll < 117) {
        linkButtons.style.opacity = (100 - scroll) / 30;
    }
};